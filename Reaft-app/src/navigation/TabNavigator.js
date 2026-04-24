import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";

import CustomTabBar from "../components/CustomTabBar";

// Screens for each tab
import BuildingScreen from "../screens/BuildingScreen";
import MapScreen from "../screens/MapScreen";
import SettingsScreen from "../screens/SettingsScreen";

const Tab = createBottomTabNavigator();

export default function TabNavigator({ onDevShowOnboarding }) {
  return (
    <NavigationContainer>
      <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="building" component={BuildingScreen} />
        <Tab.Screen name="map" component={MapScreen} />
        <Tab.Screen name="settings">
          {(props) => (
            <SettingsScreen
              {...props}
              onDevShowOnboarding={onDevShowOnboarding}
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}
