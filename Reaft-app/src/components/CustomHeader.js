import PropTypes from "prop-types";
import { View, Text } from "react-native";

export default function CustomHeader({ title = "Reaft" }) {
  return (
    <View
      className="w-full px-4 py-3 bg-white border-b border-gray-200"
      style={{ zIndex: 40, elevation: 12 }}
    >
      <Text className="text-xl font-bold text-gray-800">{title}</Text>
    </View>
  );
}

CustomHeader.propTypes = {
  title: PropTypes.string,
};

CustomHeader.defaultProps = {
  title: "Reaft",
};
