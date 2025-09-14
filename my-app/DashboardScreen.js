import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
} from "react-native";
import { Card, Title, Paragraph } from "react-native-paper";
import { LineChart, BarChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

const DashboardScreen = ({ navigation }) => {
  const [counts, setCounts] = useState({
    users: 0,
    posts: 0,
    reports: 0,
  });
  const [userProfileImage, setUserProfileImage] = useState("");

  // ข้อมูลกราฟ
  const [monthlyData, setMonthlyData] = useState(null);
  const [dailyData, setDailyData] = useState(null);

  useEffect(() => {
    fetchCounts();
    fetchUserProfile();
    fetchMonthlyUserSignups();
    fetchDailyUserSignups();
  }, []);

  const fetchCounts = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/counts");
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      setCounts(data);
    } catch (error) {
      console.error("Failed to fetch counts:", error);
    }
  };

  const fetchUserProfile = async () => {
    try {
      // สมมติ userId เก็บใน AsyncStorage
      // const userId = await AsyncStorage.getItem("userId");
      const userId = "123"; // ตัวอย่าง userId
      if (userId) {
        const response = await fetch(`http://localhost:3000/users/${userId}`);
        if (!response.ok) throw new Error("Failed to fetch user data");
        const data = await response.json();
        setUserProfileImage(
          data.avatar ? `http://localhost:3000/${data.avatar}` : ""
        );
      }
    } catch (error) {
      console.error("Error fetching profile image:", error);
    }
  };

  const fetchMonthlyUserSignups = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/users/monthly");
      const data = await res.json();
      // แปลงข้อมูลให้เป็น labels กับ data
      const labels = data.map(
        (item) => `${item.year}-${String(item.month).padStart(2, "0")}`
      );
      const counts = data.map((item) => item.user_count);
      setMonthlyData({ labels, counts });
    } catch (error) {
      console.error("Failed to fetch monthly user signups:", error);
    }
  };

  const fetchDailyUserSignups = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/users/daily");
      const data = await res.json();
      // แสดงแค่ 7 วันล่าสุด
      const recentData = data.slice(-7);
      const labels = recentData.map((item) => item.date);
      const counts = recentData.map((item) => item.user_count);
      setDailyData({ labels, counts });
    } catch (error) {
      console.error("Failed to fetch daily user signups:", error);
    }
  };

  return (
    <ScrollView
      style={styles.wrapper}
      contentContainerStyle={{ paddingBottom: 50 }}
    >
      {/* Header bar */}
      <View style={styles.header}>
        <View style={styles.navRight}>
          <TouchableOpacity onPress={() => navigation.navigate("Dashboard")}>
            <Text style={styles.CnavItem}>DASHBOARD</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("Report")}>
            <Text style={styles.navItem}>REPORT</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("Forum")}>
            <Text style={styles.navItem}>FORUM</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("User")}>
            <Text style={styles.navItem}>USER</Text>
          </TouchableOpacity>
          {userProfileImage ? (
            <Image source={{ uri: userProfileImage }} style={styles.avatar} />
          ) : (
            <Text style={styles.profile}>My Profile</Text>
          )}
        </View>
      </View>

      {/* Count Cards */}
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>User count</Title>
            <Paragraph style={styles.cardText}>{counts.users}</Paragraph>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Post count</Title>
            <Paragraph style={styles.cardText}>{counts.posts}</Paragraph>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Report count</Title>
            <Paragraph style={styles.cardText}>{counts.reports}</Paragraph>
          </Card.Content>
        </Card>
      </View>

      {/* User Signups Monthly (Line Chart) */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>User Signups Per Month</Text>
        {monthlyData ? (
          <LineChart
            data={{
              labels: monthlyData.labels,
              datasets: [{ data: monthlyData.counts }],
            }}
            width={screenWidth - 40}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={chartConfig}
            style={styles.chart}
            bezier
          />
        ) : (
          <Text style={styles.loadingText}>Loading monthly data...</Text>
        )}
      </View>

      {/* User Signups Daily (Bar Chart) */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>User Signups Last 7 Days</Text>
        {dailyData ? (
          <BarChart
            data={{
              labels: dailyData.labels,
              datasets: [{ data: dailyData.counts }],
            }}
            width={screenWidth - 40}
            height={220}
            yAxisLabel=""
            chartConfig={chartConfig}
            style={styles.chart}
            verticalLabelRotation={45}
          />
        ) : (
          <Text style={styles.loadingText}>Loading daily data...</Text>
        )}
      </View>
    </ScrollView>
  );
};

const chartConfig = {
  backgroundColor: "#303030",
  backgroundGradientFrom: "#3c3c3c",
  backgroundGradientTo: "#1a1a1a",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(255, 204, 0, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  style: { borderRadius: 16 },
  propsForDots: { r: "4", strokeWidth: "2", stroke: "#FFCC00" },
};

const styles = StyleSheet.create({
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginLeft: 20,
  },

  wrapper: {
    flex: 1,
    backgroundColor: "#303030",
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 10,
  },
  navRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  navItem: {
    color: "#ffffff",
    marginHorizontal: 10,
    fontSize: 18,
  },
  CnavItem: {
    color: "#F58637",
    marginHorizontal: 10,
    fontSize: 18,
  },
  profile: {
    color: "#FFCC00",
    marginLeft: 20,
    fontSize: 18,
  },
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  card: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 10,
    backgroundColor: "#4D4D4D",
    height: 100,
  },
  cardText: {
    color: "#ffffff",
    fontSize: 32,
    alignSelf: "center",
  },
  cardTitle: {
    color: "#7E7E7E",
    fontSize: 14,
    fontWeight: "bold",
  },
  chartContainer: {
    marginTop: 20,
    alignItems: "center",
    color: "#7E7E7E",
  },
  chartTitle: {
    color: "#F58637",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 8,
  },
  chart: {
    borderRadius: 16,
  },
  loadingText: {
    color: "#ccc",
    fontStyle: "italic",
  },
});

export default DashboardScreen;
