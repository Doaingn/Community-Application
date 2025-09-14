import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  FlatList,
} from "react-native";
import { Video } from "expo-av"; // Video from expo-av
import * as ImagePicker from "expo-image-picker";
import { MaterialCommunityIcons } from "react-native-vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import MapLocationPicker from "./MapLocationPicker";
import * as Location from "expo-location";

export default function CreatePost({ navigation, route }) {
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(0); // Set default category to null
  const [imageUris, setImageUris] = useState([]);
  const [videoUris, setVideoUris] = useState([]);
  const [userId, setUserId] = useState(null);
  const [categories, setCategories] = useState([]); // State สำหรับเก็บหมวดหมู่
  const [locationName, setLocationName] = useState("");
  const [mapPickerVisible, setMapPickerVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
      ),
      headerTitle: "Create Post",
      headerTitleStyle: {
        fontSize: 24,
        color: "white",
        fontWeight: "bold",
      },
      headerStyle: {
        backgroundColor: "#303030",
      },
    });

    // Fetch userId
    if (route.params?.userId) {
      setUserId(route.params.userId);
    } else {
      const getUserId = async () => {
        const storedUserId = await AsyncStorage.getItem("userId");
        setUserId(storedUserId);
      };
      getUserId();
    }

    // Fetch categories from the API
    const fetchCategories = async () => {
      try {
        const response = await fetch("http://192.168.1.113:3000/categories");
        const data = await response.json();
        setCategories(data); // Update categories
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, [navigation, route]);

  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Sorry, we need camera roll permissions to make this work!");
    }
  };

  const handleRemoveMedia = (item, index) => {
    Alert.alert(
      "",
      "Are you sure you want to remove this media?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Confirm",
          onPress: () => {
            if (item.type === "image") {
              setImageUris((prev) => prev.filter((_, i) => i !== index));
            } else if (item.type === "video") {
              setVideoUris((prev) => prev.filter((_, i) => i !== index));
            }
          },
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
  };

  const pickImages = async () => {
    await requestPermission();
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
      selectionLimit: 5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUris((prevUris) => [
        ...prevUris,
        ...result.assets.map((asset) => asset.uri),
      ]);
    }
  };

  const pickVideos = async () => {
    await requestPermission();
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
      selectionLimit: 3,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setVideoUris((prevUris) => [
        ...prevUris,
        ...result.assets.map((asset) => asset.uri),
      ]);
    }
  };

  const combinedMedia = [
    ...imageUris.map((uri) => ({ uri, type: "image" })),
    ...videoUris.map((uri) => ({ uri, type: "video" })),
  ];

  const renderMediaItem = ({ item, index }) => (
    <TouchableOpacity
      onPress={() => handleRemoveMedia(item, index)}
      key={index}
    >
      {item.type === "image" ? (
        <Image source={{ uri: item.uri }} style={styles.mediaThumbnail} />
      ) : (
        <Video
          source={{ uri: item.uri }}
          useNativeControls
          resizeMode="cover"
          style={styles.mediaThumbnail}
        />
      )}
    </TouchableOpacity>
  );

  const createPost = async () => {
    if (!topic) {
      Alert.alert("Error", "Please enter a topic");
      return;
    }
    if (!description) {
      Alert.alert("Error", "Please enter a description");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("topic", topic);
      formData.append("description", description);
      formData.append("p_user_id", userId);
      formData.append("category_id", category);

      if (locationName) {
        formData.append("location", locationName);
        if (latitude !== null && longitude !== null) {
          formData.append("latitude", latitude.toString());
          formData.append("longitude", longitude.toString());
        }
      }

      // ใส่รูปภาพ
      imageUris.forEach((uri, index) => {
        formData.append("media", {
          uri,
          type: "image/jpeg",
          name: `image-${index}.jpg`,
        });
      });

      // ใส่วิดีโอ
      videoUris.forEach((uri, index) => {
        formData.append("media", {
          uri,
          type: "video/mp4",
          name: `video-${index}.mp4`,
        });
      });

      console.log("Submitting post with data:", {
        topic,
        description,
        category,
        userId,
        mediaCount: imageUris.length + videoUris.length,
        locationInfo: locationName
          ? {
              name: locationName,
              latitude,
              longitude,
            }
          : "No location",
      });

      const response = await fetch("http://192.168.1.113:3000/posts", {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const contentType = response.headers.get("content-type");

      let result;
      if (contentType && contentType.includes("application/json")) {
        result = await response.json();
      } else {
        result = await response.text(); // fallback if response is plain text
      }

      if (response.ok) {
        Alert.alert("Success", "Post created successfully");

        setTopic("");
        setDescription("");
        setCategory(0);
        setImageUris([]);
        setVideoUris([]);
        setLocationName("");
        setLatitude(null);
        setLongitude(null);
        navigation.goBack();
      } else {
        console.error("Error creating post:", result);
        Alert.alert("Error", result.message || "Error creating post");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      Alert.alert("Error", "Network error or server unavailable");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Topic"
        value={topic}
        onChangeText={setTopic}
        placeholderTextColor="#fff"
      />
      <TextInput
        style={styles.inputD}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        placeholderTextColor="#fff"
        multiline={true}
      />

      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={category}
          onValueChange={(itemValue) => setCategory(itemValue)}
          style={styles.picker}
          dropdownIconColor="#fff"
        >
          <Picker.Item label="Select Category" value={0} />
          {categories.map((cat) => (
            <Picker.Item
              key={cat.category_id}
              label={cat.name}
              value={cat.category_id}
            />
          ))}
        </Picker>
      </View>
      {locationName ? (
        <View style={styles.locationContainer}>
          <MaterialCommunityIcons name="map-marker" size={20} color="#FF7900" />
          <Text style={styles.locationText} numberOfLines={2}>
            {locationName}
          </Text>
          <TouchableOpacity
            onPress={() => setLocationName("")}
            style={styles.clearLocationButton}
          >
            <MaterialCommunityIcons name="close" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.mediaButtons}>
        <TouchableOpacity
          onPress={pickImages}
          style={[
            styles.iconButton,
            { borderTopLeftRadius: 8, borderBottomLeftRadius: 8 },
          ]}
        >
          <MaterialCommunityIcons name="image" size={28} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={pickVideos} style={styles.iconButton}>
          <MaterialCommunityIcons name="video" size={28} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setMapPickerVisible(true)}
          style={[
            styles.iconButton,
            { borderTopRightRadius: 8, borderBottomRightRadius: 8 },
          ]}
        >
          <MaterialCommunityIcons name="map-marker" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {combinedMedia.length > 0 && (
        <View style={styles.mediaPreviewRow}>
          <FlatList
            horizontal
            data={combinedMedia}
            renderItem={renderMediaItem}
            keyExtractor={(item, index) => index.toString()}
            showsHorizontalScrollIndicator={false}
          />
        </View>
      )}

      <TouchableOpacity
        onPress={createPost}
        style={styles.createButton}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? "Loading..." : "Create Post"}
        </Text>
      </TouchableOpacity>

      <MapLocationPicker
        visible={mapPickerVisible}
        onClose={() => setMapPickerVisible(false)}
        onLocationSelect={(location) => {
          setLatitude(location.latitude);
          setLongitude(location.longitude);
          setLocationName(location.name);
          setMapPickerVisible(false);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#303030",
    paddingBottom: 150,
  },
  mediaItem: {
    marginRight: 10,
  },
  mediaThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    margin: 5,
  },
  mediaPreviewRow: {
    flexDirection: "row",
    marginBottom: 20,
  },
  iconButton: {
    backgroundColor: "#3e3e3e",
    padding: 12,
    borderRadius: 4,
    marginLeft: -3,
  },
  input: {
    borderColor: "#fff",
    borderWidth: 1,
    marginBottom: 15,
    padding: 12,
    borderRadius: 8,
    color: "#fff",
    fontSize: 16,
  },
  inputD: {
    height: 120,
    borderColor: "#fff",
    borderWidth: 1,
    marginBottom: 15,
    padding: 12,
    borderRadius: 8,
    color: "#fff",
    textAlign: "left",
    textAlignVertical: "top",
    fontSize: 16,
  },
  pickerContainer: {
    marginBottom: 15,
  },
  pickerLabel: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 8,
  },
  pickerWrapper: {
    borderColor: "#fff",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
  },
  picker: {
    color: "#fff",
    height: 50,
    width: "100%",
  },
  mediaButtons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    borderRadius: 8,
    overflow: "hidden",
  },
  mediaText: {
    color: "#fff",
    marginLeft: 8,
    fontSize: 16,
  },
  mediaPreview: {
    marginBottom: 20,
  },
  mediaPreviewImage: {
    width: 250,
    height: 250,
    resizeMode: "cover",
    marginBottom: 10,
    marginRight: 10,
    borderRadius: 8,
  },
  createButton: {
    backgroundColor: "#FF7900",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3e3e3e",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  locationText: {
    color: "#fff",
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  clearLocationButton: {
    padding: 4,
  },
  backButton: {
    marginLeft: 15,
  },
});