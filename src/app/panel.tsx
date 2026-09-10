import { Redirect, type Href } from 'expo-router';

export default function PanelScreen() {
  return <Redirect href={'/dashboard' as Href} />;
}