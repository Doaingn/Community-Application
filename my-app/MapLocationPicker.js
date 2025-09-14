import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  Dimensions,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { MaterialCommunityIcons } from "react-native-vector-icons";

const { width, height } = Dimensions.get("window");
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const MapLocationPicker = ({ visible, onClose, onLocationSelect }) => {
  const [region, setRegion] = useState({
    latitude: 13.7563, // Bangkok default
    longitude: 100.5018,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  });
  const [markerPosition, setMarkerPosition] = useState(null);
  const [locationName, setLocationName] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (visible) {
      getCurrentLocation();
    }
  }, [visible]);

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission not granted");
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      setRegion({
        latitude,
        longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });

      setMarkerPosition({ latitude, longitude });
      await getLocationName(latitude, longitude);
    } catch (error) {
      console.error("Error getting current location:", error);
      Alert.alert("Error", "Could not get your current location");
    } finally {
      setLoading(false);
    }
  };

  const getLocationName = async (latitude, longitude) => {
    try {
      const response = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (response && response.length > 0) {
        const address = response[0];
        const addressString = [
          address.name,
          address.street,
          address.district,
          address.city,
          address.region,
          address.country,
        ]
          .filter(Boolean)
          .join(", ");

        setLocationName(addressString);
      } else {
        setLocationName(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      }
    } catch (error) {
      console.error("Error getting location name:", error);
      setLocationName(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
    }
  };

  const handleMapPress = (e) => {
    const { coordinate } = e.nativeEvent;
    setMarkerPosition(coordinate);
    getLocationName(coordinate.latitude, coordinate.longitude);
  };

  const searchLocation = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      const locations = await Location.geocodeAsync(searchQuery);

      if (locations && locations.length > 0) {
        const { latitude, longitude } = locations[0];

        setRegion({
          latitude,
          longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        });

        setMarkerPosition({ latitude, longitude });
        await getLocationName(latitude, longitude);
      } else {
        Alert.alert("Not Found", "Could not find the location");
      }
    } catch (error) {
      console.error("Error searching location:", error);
      Alert.alert("Error", "Error searching for location");
    } finally {
      setLoading(false);
    }
  };

  const confirmLocation = () => {
    if (!markerPosition) {
      Alert.alert("No Location", "Please select a location on the map");
      return;
    }

    onLocationSelect({
      latitude: markerPosition.latitude,
      longitude: markerPosition.longitude,
      name: locationName,
    });

    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialCommunityIcons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>เลือกตำแหน่ง</Text>
          <TouchableOpacity
            onPress={confirmLocation}
            style={styles.confirmButton}
          >
            <Text style={styles.confirmText}>ยืนยัน</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="ค้นหาสถานที่"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={searchLocation}
            placeholderTextColor="#999"
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={searchLocation}
          >
            <MaterialCommunityIcons name="magnify" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF7900" />
          </View>
        ) : (
          <MapView
            style={styles.map}
            region={region}
            onRegionChangeComplete={setRegion}
            onPress={handleMapPress}
          >
            {markerPosition && (
              <Marker
                coordinate={markerPosition}
                draggable
                onDragEnd={(e) => {
                  setMarkerPosition(e.nativeEvent.coordinate);
                  getLocationName(
                    e.nativeEvent.coordinate.latitude,
                    e.nativeEvent.coordinate.longitude
                  );
                }}
              />
            )}
          </MapView>
        )}

        <View style={styles.bottomInfo}>
          <MaterialCommunityIcons name="map-marker" size={20} color="#FF7900" />
          <Text style={styles.locationText} numberOfLines={2}>
            {locationName || "เลือกตำแหน่งบนแผนที่"}
          </Text>
          <TouchableOpacity
            onPress={getCurrentLocation}
            style={styles.currentLocationButton}
          >
            <MaterialCommunityIcons
              name="crosshairs-gps"
              size={24}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#303030",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#3e3e3e",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 8,
  },
  confirmButton: {
    backgroundColor: "#FF7900",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  confirmText: {
    color: "#fff",
    fontWeight: "bold",
  },
  searchBar: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#3e3e3e",
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#505050",
    color: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: "#FF7900",
    justifyContent: "center",
    alignItems: "center",
    width: 46,
    borderRadius: 8,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3e3e3e",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#505050",
  },
  locationText: {
    flex: 1,
    color: "#fff",
    marginHorizontal: 10,
  },
  currentLocationButton: {
    backgroundColor: "#505050",
    padding: 10,
    borderRadius: 50,
  },
});

export default MapLocationPicker;
