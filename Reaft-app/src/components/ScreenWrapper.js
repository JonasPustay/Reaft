import PropTypes from "prop-types";
import { View, ScrollView } from "react-native";

export default function ScreenWrapper({ children, scrollable = true }) {
  const header = Array.isArray(children) ? children[0] : null;
  const content = Array.isArray(children) ? children.slice(1) : children;

  return (
    <View className="flex-1 bg-white">
      {header}

      {scrollable ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : (
        <View className="flex-1">{content}</View>
      )}
    </View>
  );
}

ScreenWrapper.propTypes = {
  children: PropTypes.node,
  scrollable: PropTypes.bool,
};

ScreenWrapper.defaultProps = {
  children: null,
  scrollable: true,
};