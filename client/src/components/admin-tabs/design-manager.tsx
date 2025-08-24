import { useState, useEffect } from "react";
import { Palette, Type, Sparkles, Image, Layout, Zap, Save, RotateCcw, Eye, EyeOff, Brush, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface DesignSettings {
  theme: 'light' | 'dark' | 'custom' | 'neon' | 'minimal' | 'glassmorphism';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    muted: string;
    mutedForeground: string;
    destructive: string;
    border: string;
    gradientStart: string;
    gradientEnd: string;
  };
  typography: {
    fontFamily: string;
    fontSize: number;
    headingFont: string;
    lineHeight: number;
    letterSpacing: number;
  };
  effects: {
    animations: boolean;
    animationSpeed: number;
    shadows: boolean;
    shadowIntensity: number;
    blur: boolean;
    blurAmount: number;
    gradients: boolean;
    borderRadius: number;
    glassmorphism: boolean;
    neonGlow: boolean;
  };
  layout: {
    spacing: number;
    compactMode: boolean;
    maxWidth: string;
    sidebar: boolean;
  };
  customCSS: string;
}

const defaultSettings: DesignSettings = {
  theme: 'custom',
  colors: {
    primary: '#8b5cf6',
    secondary: '#ec4899',
    accent: '#f59e0b',
    background: '#ffffff',
    foreground: '#1f2937',
    card: '#ffffff',
    cardForeground: '#1f2937',
    muted: '#f3f4f6',
    mutedForeground: '#6b7280',
    destructive: '#ef4444',
    border: '#e5e7eb',
    gradientStart: '#8b5cf6',
    gradientEnd: '#ec4899',
  },
  typography: {
    fontFamily: 'Inter',
    fontSize: 16,
    headingFont: 'Inter',
    lineHeight: 1.5,
    letterSpacing: 0,
  },
  effects: {
    animations: true,
    animationSpeed: 1,
    shadows: true,
    shadowIntensity: 1,
    blur: false,
    blurAmount: 10,
    gradients: true,
    borderRadius: 8,
    glassmorphism: false,
    neonGlow: false,
  },
  layout: {
    spacing: 1,
    compactMode: false,
    maxWidth: '1280px',
    sidebar: false,
  },
  customCSS: '',
};

const presetThemes = {
  napoli: {
    name: 'Napoli Pizzeria',
    colors: {
      primary: '#00c4e6',
      secondary: '#0095b6',
      accent: '#ff0000',
      background: '#ffffff',
      foreground: '#1a1a1a',
      card: '#ffffff',
      cardForeground: '#1a1a1a',
      muted: '#f0f9ff',
      mutedForeground: '#0095b6',
      destructive: '#dc2626',
      border: '#00c4e6',
      gradientStart: '#00c4e6',
      gradientEnd: '#0095b6',
    },
  },
  light: {
    name: 'Hell',
    colors: {
      primary: '#3b82f6',
      secondary: '#10b981',
      accent: '#f59e0b',
      background: '#ffffff',
      foreground: '#1f2937',
      card: '#ffffff',
      cardForeground: '#1f2937',
      muted: '#f3f4f6',
      mutedForeground: '#6b7280',
      destructive: '#ef4444',
      border: '#e5e7eb',
      gradientStart: '#3b82f6',
      gradientEnd: '#10b981',
    },
  },
  dark: {
    name: 'Dunkel',
    colors: {
      primary: '#818cf8',
      secondary: '#34d399',
      accent: '#fbbf24',
      background: '#0f172a',
      foreground: '#f8fafc',
      card: '#1e293b',
      cardForeground: '#f8fafc',
      muted: '#334155',
      mutedForeground: '#94a3b8',
      destructive: '#f87171',
      border: '#334155',
      gradientStart: '#818cf8',
      gradientEnd: '#34d399',
    },
  },
  neon: {
    name: 'Neon Cyberpunk',
    colors: {
      primary: '#00ffff',
      secondary: '#ff00ff',
      accent: '#ffff00',
      background: '#0a0a0a',
      foreground: '#ffffff',
      card: '#1a1a1a',
      cardForeground: '#ffffff',
      muted: '#2a2a2a',
      mutedForeground: '#cccccc',
      destructive: '#ff0066',
      border: '#333333',
      gradientStart: '#00ffff',
      gradientEnd: '#ff00ff',
    },
  },
  minimal: {
    name: 'Minimal',
    colors: {
      primary: '#000000',
      secondary: '#666666',
      accent: '#000000',
      background: '#ffffff',
      foreground: '#000000',
      card: '#fafafa',
      cardForeground: '#000000',
      muted: '#f5f5f5',
      mutedForeground: '#666666',
      destructive: '#cc0000',
      border: '#e0e0e0',
      gradientStart: '#ffffff',
      gradientEnd: '#f0f0f0',
    },
  },
  glassmorphism: {
    name: 'Glass',
    colors: {
      primary: '#4f46e5',
      secondary: '#7c3aed',
      accent: '#ec4899',
      background: '#f9fafb',
      foreground: '#111827',
      card: 'rgba(255, 255, 255, 0.7)',
      cardForeground: '#111827',
      muted: 'rgba(243, 244, 246, 0.7)',
      mutedForeground: '#6b7280',
      destructive: '#ef4444',
      border: 'rgba(229, 231, 235, 0.5)',
      gradientStart: '#4f46e5',
      gradientEnd: '#ec4899',
    },
  },
};

const fontOptions = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Raleway',
  'Playfair Display',
  'Merriweather',
  'Ubuntu',
  'Oswald',
  'Bebas Neue',
  'Comic Sans MS',
  'Impact',
  'Georgia',
  'Times New Roman',
  'Arial',
  'Helvetica',
  'Courier New',
  'Verdana',
];

export default function DesignManager() {
  const [settings, setSettings] = useState<DesignSettings>(() => {
    const saved = localStorage.getItem('designSettings');
    // Automatisch Napoli Theme laden wenn nichts gespeichert ist
    if (!saved) {
      const napoliSettings = {
        ...defaultSettings,
        theme: 'napoli' as any,
        colors: {
          ...defaultSettings.colors,
          ...presetThemes.napoli.colors,
        },
      };
      return napoliSettings;
    }
    return JSON.parse(saved);
  });
  const [preview, setPreview] = useState(true);
  const { toast } = useToast();

  // Apply settings to document
  useEffect(() => {
    applySettings(settings);
    // Napoli Theme Class hinzufügen
    if (settings.theme === 'napoli' || settings.colors.primary === '#00c4e6') {
      document.body.classList.add('napoli-theme');
    } else {
      document.body.classList.remove('napoli-theme');
    }
  }, [settings]);

  const applySettings = (newSettings: DesignSettings) => {
    const root = document.documentElement;
    
    // Apply colors
    Object.entries(newSettings.colors).forEach(([key, value]) => {
      if (key === 'background') {
        root.style.setProperty('--background', value);
        document.body.style.backgroundColor = value;
      } else if (key === 'foreground') {
        root.style.setProperty('--foreground', value);
        document.body.style.color = value;
      } else {
        root.style.setProperty(`--${key}`, value);
      }
    });

    // Apply typography
    root.style.setProperty('--font-family', newSettings.typography.fontFamily);
    root.style.setProperty('--heading-font', newSettings.typography.headingFont);
    root.style.fontSize = `${newSettings.typography.fontSize}px`;
    root.style.lineHeight = `${newSettings.typography.lineHeight}`;
    root.style.letterSpacing = `${newSettings.typography.letterSpacing}px`;

    // Apply effects
    root.style.setProperty('--border-radius', `${newSettings.effects.borderRadius}px`);
    root.style.setProperty('--animation-speed', `${newSettings.effects.animationSpeed}s`);
    root.style.setProperty('--shadow-intensity', `${newSettings.effects.shadowIntensity}`);
    root.style.setProperty('--blur-amount', `${newSettings.effects.blurAmount}px`);

    // Apply layout
    root.style.setProperty('--spacing-unit', `${newSettings.layout.spacing}rem`);
    root.style.setProperty('--max-width', newSettings.layout.maxWidth);

    // Toggle classes
    document.body.classList.toggle('animations-enabled', newSettings.effects.animations);
    document.body.classList.toggle('shadows-enabled', newSettings.effects.shadows);
    document.body.classList.toggle('gradients-enabled', newSettings.effects.gradients);
    document.body.classList.toggle('glassmorphism', newSettings.effects.glassmorphism);
    document.body.classList.toggle('neon-glow', newSettings.effects.neonGlow);
    document.body.classList.toggle('compact-mode', newSettings.layout.compactMode);

    // Apply custom CSS
    let customStyleTag = document.getElementById('custom-design-styles');
    if (!customStyleTag) {
      customStyleTag = document.createElement('style');
      customStyleTag.id = 'custom-design-styles';
      document.head.appendChild(customStyleTag);
    }
    customStyleTag.textContent = newSettings.customCSS;
  };

  const handleColorChange = (colorKey: keyof typeof settings.colors, value: string) => {
    setSettings(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorKey]: value,
      },
    }));
  };

  const handleTypographyChange = (key: keyof typeof settings.typography, value: string | number) => {
    setSettings(prev => ({
      ...prev,
      typography: {
        ...prev.typography,
        [key]: value,
      },
    }));
  };

  const handleEffectChange = (key: keyof typeof settings.effects, value: boolean | number) => {
    setSettings(prev => ({
      ...prev,
      effects: {
        ...prev.effects,
        [key]: value,
      },
    }));
  };

  const handleLayoutChange = (key: keyof typeof settings.layout, value: string | number | boolean) => {
    setSettings(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        [key]: value,
      },
    }));
  };

  const saveSettings = () => {
    localStorage.setItem('designSettings', JSON.stringify(settings));
    toast({
      title: "Design gespeichert",
      description: "Ihre Design-Einstellungen wurden erfolgreich gespeichert.",
    });
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('designSettings');
    toast({
      title: "Design zurückgesetzt",
      description: "Alle Einstellungen wurden auf die Standardwerte zurückgesetzt.",
    });
  };

  const loadPreset = (presetKey: keyof typeof presetThemes) => {
    const preset = presetThemes[presetKey];
    setSettings(prev => ({
      ...prev,
      theme: presetKey as any,
      colors: {
        ...prev.colors,
        ...preset.colors,
      },
      effects: {
        ...prev.effects,
        neonGlow: presetKey === 'neon',
        glassmorphism: presetKey === 'glassmorphism',
      },
    }));
    toast({
      title: "Theme geladen",
      description: `Das ${preset.name} Theme wurde angewendet.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <Palette className="h-8 w-8" />
          Design Manager
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPreview(!preview)}
          >
            {preview ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
            {preview ? 'Vorschau An' : 'Vorschau Aus'}
          </Button>
          <Button onClick={saveSettings} className="bg-gradient-to-r from-purple-500 to-pink-500">
            <Save className="h-4 w-4 mr-2" />
            Speichern
          </Button>
          <Button variant="outline" onClick={resetSettings}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Zurücksetzen
          </Button>
        </div>
      </div>

      <Tabs defaultValue="themes" className="space-y-4">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="themes">Themes</TabsTrigger>
          <TabsTrigger value="colors">Farben</TabsTrigger>
          <TabsTrigger value="typography">Schrift</TabsTrigger>
          <TabsTrigger value="effects">Effekte</TabsTrigger>
          <TabsTrigger value="layout">Layout</TabsTrigger>
          <TabsTrigger value="custom">Custom CSS</TabsTrigger>
        </TabsList>

        <TabsContent value="themes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vorgefertigte Themes</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              {Object.entries(presetThemes).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => loadPreset(key as keyof typeof presetThemes)}
                  className="p-4 border rounded-lg hover:shadow-lg transition-all group"
                  style={{
                    background: `linear-gradient(135deg, ${preset.colors.gradientStart}, ${preset.colors.gradientEnd})`,
                  }}
                >
                  <div className="bg-white bg-opacity-90 rounded p-3">
                    <h4 className="font-bold text-gray-800">{preset.name}</h4>
                    <div className="flex gap-1 mt-2">
                      {Object.values(preset.colors).slice(0, 5).map((color, i) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded-full border"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="colors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Farbpalette</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              {Object.entries(settings.colors).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key} className="capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id={key}
                      type="color"
                      value={value}
                      onChange={(e) => handleColorChange(key as keyof typeof settings.colors, e.target.value)}
                      className="w-20 h-10 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={value}
                      onChange={(e) => handleColorChange(key as keyof typeof settings.colors, e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="typography" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Typografie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hauptschriftart</Label>
                  <Select
                    value={settings.typography.fontFamily}
                    onValueChange={(value) => handleTypographyChange('fontFamily', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontOptions.map(font => (
                        <SelectItem key={font} value={font}>
                          <span style={{ fontFamily: font }}>{font}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Überschriften-Schriftart</Label>
                  <Select
                    value={settings.typography.headingFont}
                    onValueChange={(value) => handleTypographyChange('headingFont', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontOptions.map(font => (
                        <SelectItem key={font} value={font}>
                          <span style={{ fontFamily: font }}>{font}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Schriftgröße: {settings.typography.fontSize}px</Label>
                <Slider
                  value={[settings.typography.fontSize]}
                  onValueChange={([value]) => handleTypographyChange('fontSize', value)}
                  min={12}
                  max={24}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label>Zeilenhöhe: {settings.typography.lineHeight}</Label>
                <Slider
                  value={[settings.typography.lineHeight]}
                  onValueChange={([value]) => handleTypographyChange('lineHeight', value)}
                  min={1}
                  max={2}
                  step={0.1}
                />
              </div>

              <div className="space-y-2">
                <Label>Buchstabenabstand: {settings.typography.letterSpacing}px</Label>
                <Slider
                  value={[settings.typography.letterSpacing]}
                  onValueChange={([value]) => handleTypographyChange('letterSpacing', value)}
                  min={-2}
                  max={5}
                  step={0.1}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="effects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Visuelle Effekte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="animations">Animationen</Label>
                  <Switch
                    id="animations"
                    checked={settings.effects.animations}
                    onCheckedChange={(value) => handleEffectChange('animations', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="shadows">Schatten</Label>
                  <Switch
                    id="shadows"
                    checked={settings.effects.shadows}
                    onCheckedChange={(value) => handleEffectChange('shadows', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="gradients">Verläufe</Label>
                  <Switch
                    id="gradients"
                    checked={settings.effects.gradients}
                    onCheckedChange={(value) => handleEffectChange('gradients', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="glassmorphism">Glassmorphism</Label>
                  <Switch
                    id="glassmorphism"
                    checked={settings.effects.glassmorphism}
                    onCheckedChange={(value) => handleEffectChange('glassmorphism', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="neonGlow">Neon Glow</Label>
                  <Switch
                    id="neonGlow"
                    checked={settings.effects.neonGlow}
                    onCheckedChange={(value) => handleEffectChange('neonGlow', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="blur">Blur Effekte</Label>
                  <Switch
                    id="blur"
                    checked={settings.effects.blur}
                    onCheckedChange={(value) => handleEffectChange('blur', value)}
                  />
                </div>
              </div>

              {settings.effects.animations && (
                <div className="space-y-2">
                  <Label>Animationsgeschwindigkeit: {settings.effects.animationSpeed}s</Label>
                  <Slider
                    value={[settings.effects.animationSpeed]}
                    onValueChange={([value]) => handleEffectChange('animationSpeed', value)}
                    min={0.1}
                    max={3}
                    step={0.1}
                  />
                </div>
              )}

              {settings.effects.shadows && (
                <div className="space-y-2">
                  <Label>Schattenintensität: {settings.effects.shadowIntensity}</Label>
                  <Slider
                    value={[settings.effects.shadowIntensity]}
                    onValueChange={([value]) => handleEffectChange('shadowIntensity', value)}
                    min={0}
                    max={2}
                    step={0.1}
                  />
                </div>
              )}

              {settings.effects.blur && (
                <div className="space-y-2">
                  <Label>Blur-Stärke: {settings.effects.blurAmount}px</Label>
                  <Slider
                    value={[settings.effects.blurAmount]}
                    onValueChange={([value]) => handleEffectChange('blurAmount', value)}
                    min={0}
                    max={20}
                    step={1}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Eckenradius: {settings.effects.borderRadius}px</Label>
                <Slider
                  value={[settings.effects.borderRadius]}
                  onValueChange={([value]) => handleEffectChange('borderRadius', value)}
                  min={0}
                  max={24}
                  step={1}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layout" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Layout-Einstellungen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Abstand-Einheit: {settings.layout.spacing}rem</Label>
                <Slider
                  value={[settings.layout.spacing]}
                  onValueChange={([value]) => handleLayoutChange('spacing', value)}
                  min={0.5}
                  max={2}
                  step={0.1}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="compactMode">Kompaktmodus</Label>
                <Switch
                  id="compactMode"
                  checked={settings.layout.compactMode}
                  onCheckedChange={(value) => handleLayoutChange('compactMode', value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Maximale Breite</Label>
                <Select
                  value={settings.layout.maxWidth}
                  onValueChange={(value) => handleLayoutChange('maxWidth', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1024px">Klein (1024px)</SelectItem>
                    <SelectItem value="1280px">Mittel (1280px)</SelectItem>
                    <SelectItem value="1536px">Groß (1536px)</SelectItem>
                    <SelectItem value="100%">Vollbreite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Eigenes CSS</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={settings.customCSS}
                onChange={(e) => setSettings(prev => ({ ...prev, customCSS: e.target.value }))}
                placeholder="/* Fügen Sie hier Ihr eigenes CSS ein */
.custom-class {
  color: red;
}"
                className="font-mono min-h-[300px]"
              />
              <p className="text-sm text-gray-500 mt-2">
                Fortgeschrittene Nutzer können hier eigenes CSS hinzufügen, um das Design weiter anzupassen.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {preview && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Live-Vorschau</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 p-4 border rounded-lg" style={{
              background: settings.effects.gradients 
                ? `linear-gradient(135deg, ${settings.colors.gradientStart}, ${settings.colors.gradientEnd})`
                : settings.colors.background,
            }}>
              <h1 className="text-3xl font-bold" style={{ 
                fontFamily: settings.typography.headingFont,
                color: settings.colors.foreground 
              }}>
                Beispiel-Überschrift
              </h1>
              <p style={{ 
                fontFamily: settings.typography.fontFamily,
                color: settings.colors.mutedForeground 
              }}>
                Dies ist ein Beispieltext, um zu zeigen, wie Ihre Design-Einstellungen aussehen werden.
              </p>
              <div className="flex gap-2">
                <Button style={{ 
                  backgroundColor: settings.colors.primary,
                  color: 'white'
                }}>
                  Primär Button
                </Button>
                <Button variant="outline" style={{ 
                  borderColor: settings.colors.border,
                  color: settings.colors.foreground
                }}>
                  Outline Button
                </Button>
              </div>
              <Card style={{ 
                backgroundColor: settings.colors.card,
                borderColor: settings.colors.border
              }}>
                <CardContent className="p-4">
                  <p style={{ color: settings.colors.cardForeground }}>
                    Dies ist eine Beispiel-Karte mit Ihren Farbeinstellungen.
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}