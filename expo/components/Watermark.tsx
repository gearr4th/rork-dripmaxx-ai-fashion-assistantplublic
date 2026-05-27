import React from "react";
import { View, Image, StyleSheet } from "react-native";

/**
 * Overlays the DripMaxx AI logo watermark in the bottom-right corner.
 * Used for free-tier and trial users. Takes ~15% of the container width
 * at 65% opacity so it's visible but doesn't hide the outfit.
 */
export default function Watermark() {
  return (
    <View style={styles.container} pointerEvents="none">
      <Image
        source={{
          uri: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/mc3cd1wnqzb2fjaje2y10.png",
        }}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: "15%",
    aspectRatio: 1,
    opacity: 0.65,
    zIndex: 10,
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
