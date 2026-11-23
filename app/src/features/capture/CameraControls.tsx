import {Text, TouchableOpacity, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useTheme} from '@/shared/ThemeContext';
import {controls} from './CameraControls.styles';

// expo-camera zoom is 0..1 of the phone's maximum, so these are gentle steps.
export const ZOOM_STEPS = [
  {label: 'Normal', value: 0},
  {label: 'Closer', value: 0.2},
  {label: 'Closest', value: 0.4},
];

type ZoomBarProps = {zoom: number; onChange: (zoom: number) => void};

// Hold the phone farther away and zoom in, so its shadow stays off the rock.
export function ZoomBar({zoom, onChange}: ZoomBarProps) {
  return (
    <View style={controls.zoomBar}>
      {ZOOM_STEPS.map(step => {
        const active = step.value === zoom;
        return (
          <TouchableOpacity
            key={step.label}
            style={[controls.zoomBtn, active && controls.zoomBtnActive]}
            onPress={() => onChange(step.value)}
            accessibilityRole="button"
            accessibilityState={{selected: active}}>
            <Text style={[controls.zoomText, active && controls.zoomTextActive]}>
              {step.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

type LightProps = {on: boolean; onToggle: () => void};

export function LightButton({on, onToggle}: LightProps) {
  const {colors} = useTheme();
  const fg = on ? '#fff' : colors.text;
  return (
    <TouchableOpacity
      style={[
        controls.lightBtn,
        {borderColor: colors.text, backgroundColor: on ? colors.accent : colors.card},
      ]}
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityState={{selected: on}}>
      <Ionicons name={on ? 'flashlight' : 'flashlight-outline'} size={28} color={fg} />
      <Text style={[controls.lightText, {color: fg}]}>Light</Text>
    </TouchableOpacity>
  );
}
