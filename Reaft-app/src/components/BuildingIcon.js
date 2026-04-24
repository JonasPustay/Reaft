import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import PropTypes from "prop-types";

// Mapping des anciennes icônes invalides vers des icônes valides
const ICON_MAPPING = {
  building: { icon: "business", family: "ionicons" },
  warehouse: { icon: "cube", family: "ionicons" },
  industry: { icon: "construct", family: "ionicons" },
};

// Icônes qui utilisent MaterialCommunityIcons (Set pour has en O(1))
const MATERIAL_ICONS = new Set(["church"]);

export const getIconInfo = (iconName) => {
  if (!iconName) return { icon: "business", family: "ionicons" };

  // Vérifier si c'est une ancienne icône à mapper
  if (ICON_MAPPING[iconName]) {
    return ICON_MAPPING[iconName];
  }

  // Vérifier si c'est une icône MaterialCommunityIcons
  if (MATERIAL_ICONS.has(iconName)) {
    return { icon: iconName, family: "material-community" };
  }

  // Par défaut, c'est une icône Ionicons
  return { icon: iconName, family: "ionicons" };
};

// Composant pour afficher l'icône selon la famille
export default function BuildingIcon({ iconName, size, color, style }) {
  const { icon, family } = getIconInfo(iconName);

  if (family === "material-community") {
    return (
      <MaterialCommunityIcons name={icon} size={size} color={color} style={style} />
    );
  }
  return <Ionicons name={icon} size={size} color={color} style={style} />;
}

BuildingIcon.propTypes = {
  iconName: PropTypes.string,
  size: PropTypes.number,
  color: PropTypes.string,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

BuildingIcon.defaultProps = {
  iconName: undefined,
  size: 20,
  color: "#000",
  style: undefined,
};
