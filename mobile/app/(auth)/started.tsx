
import { useCallback, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Image,
  type ImageSourcePropType,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import images from "../../assets/images";

type Slide = {
  id: string;
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
};

const SLIDES: Slide[] = [
  {
    id: "1",
    title: "Everything in one place",
    subtitle: "Access all the services you need from a single, easy-to-use app.",
    image: images.onboarding,
  },
  {
    id: "2",
    title: "Fast & hassle-free",
    subtitle: "Complete your tasks in a few taps, without the stress or the wait.",
    image: images.onboarding,
  },
  {
    id: "3",
    title: "Simple and secure",
    subtitle: "Your account and data are protected every step of the way.",
    image: images.onboarding,
  },
];

const Started = () => {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const listRef = useRef<FlatList<Slide>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const [index, setIndex] = useState(0);

  const isLast = index === SLIDES.length - 1;

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: true }
  );

  const onViewableItemsChanged = useRef(
    ({
      viewableItems,
    }: {
      viewableItems: Array<{ index?: number | null }>;
    }) => {
      const visibleIndex = viewableItems[0]?.index;

      if (visibleIndex != null) {
        setIndex(visibleIndex);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  const goToRegister = useCallback(() => {
    router.replace("/(auth)/register");
  }, [router]);

  const handleNext = () => {
    if (isLast) {
      goToRegister();
      return;
    }

    listRef.current?.scrollToIndex({
      index: index + 1,
      animated: true,
    });
  };

  const renderItem = ({
    item,
    index: slideIndex,
  }: {
    item: Slide;
    index: number;
  }) => {
    const inputRange = [
      (slideIndex - 1) * width,
      slideIndex * width,
      (slideIndex + 1) * width,
    ];

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0, 1, 0],
      extrapolate: "clamp",
    });

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: "clamp",
    });

    const textTranslate = scrollX.interpolate({
      inputRange,
      outputRange: [width * 0.25, 0, -width * 0.25],
      extrapolate: "clamp",
    });

    return (
      <View style={[styles.slide, { width }]}>
        <Animated.View
          style={[
            styles.illustrationWrapper,
            { opacity, transform: [{ scale }] },
          ]}
        >
          <Image
            source={item.image}
            style={styles.illustration}
            resizeMode="contain"
            accessibilityLabel={item.title}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.textBlock,
            {
              opacity,
              transform: [{ translateX: textTranslate }],
            },
          ]}
        >
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.subtitle}>{item.subtitle}</Text>
        </Animated.View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <View style={styles.topBar}>
        <View style={styles.brand}>
          <Image
            source={images.jt}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="JTECH HUB logo"
          />

          <Text style={styles.brandText}>JTECH HUB</Text>
        </View>

        {!isLast && (
          <Pressable
            onPress={goToRegister}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
          >
            <Text style={styles.skip}>Skip</Text>
          </Pressable>
        )}
      </View>

      <Animated.FlatList
        ref={listRef as any}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, i) => ({
          length: width,
          offset: width * i,
          index: i,
        })}
        style={styles.list}
      />

      <View style={styles.footer}>
        <View style={styles.dots} accessibilityRole="progressbar">
          {SLIDES.map((_, i) => {
            const inputRange = [
              (i - 1) * width,
              i * width,
              (i + 1) * width,
            ];

            const scaleX = scrollX.interpolate({
              inputRange,
              outputRange: [1, 3, 1],
              extrapolate: "clamp",
            });

            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: "clamp",
            });

            return (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  {
                    opacity,
                    transform: [{ scaleX }],
                  },
                ]}
              />
            );
          })}
        </View>

        <Pressable
          onPress={handleNext}
          accessibilityRole="button"
          accessibilityLabel={isLast ? "Get started" : "Next slide"}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>
            {isLast ? "Get Started" : "Next"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/(auth)/login")}
          hitSlop={8}
          accessibilityRole="link"
          style={styles.signInRow}
        >
          <Text style={styles.signInText}>
            Already have an account?{" "}
            <Text style={styles.signInLink}>Sign in</Text>
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const colors = {
  background: "#FFFFFF",
  primary: "#741B2B",
  tint: "#F8EEF0",
  textPrimary: "#111827",
  textSecondary: "#6B7280",
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 8,
    height: 48,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logo: {
    width: 32,
    height: 32,
  },
  brandText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 0.5,
  },
  skip: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  list: {
    flex: 1,
  },
  slide: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  illustrationWrapper: {
    flex: 1,
    width: "100%",
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 32,
    backgroundColor: colors.tint,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  illustration: {
    width: "100%",
    height: "100%",
  },
  textBlock: {
    alignItems: "center",
    paddingVertical: 24,
    minHeight: 140,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    alignItems: "center",
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 16,
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  button: {
    width: "100%",
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  signInRow: {
    marginTop: 16,
    paddingVertical: 4,
  },
  signInText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  signInLink: {
    color: colors.primary,
    fontWeight: "700",
  },
});

export default Started;
