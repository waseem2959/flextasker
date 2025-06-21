/**
 * Accessibility Menu Component
 * 
 * Comprehensive accessibility control panel with settings for visual, motor,
 * cognitive, and cultural accessibility features for UAE users.
 */

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Eye,
  Sun,
  Moon,
  Monitor,
  ZoomIn,
  MousePointer,
  Brain,
  Headphones,
  RotateCcw,
  Check,
  Info
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../ui/dialog';
import { Separator } from '../ui/separator';
import { cn } from '../../lib/utils';
import { useAccessibility, AccessibilitySettings } from './accessibility-provider';
import { i18nService } from '../../../shared/services/i18n-service';
import { LanguageSwitcher } from '../ui/language-switcher';

interface AccessibilityMenuProps {
  className?: string;
  trigger?: React.ReactNode;
}

interface SettingSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  settings: Array<{
    key: keyof AccessibilitySettings;
    type: 'toggle' | 'select' | 'slider' | 'custom';
    label: string;
    description: string;
    options?: Array<{ value: any; label: string }>;
    min?: number;
    max?: number;
    step?: number;
  }>;
}

const AccessibilityMenu: React.FC<AccessibilityMenuProps> = ({
  className = '',
  trigger
}) => {
  const { state, actions } = useAccessibility();
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('visual');
  const [hasChanges, setHasChanges] = useState(false);

  // Track changes to settings
  useEffect(() => {
    const defaultSettings: AccessibilitySettings = {
      highContrast: false,
      reducedMotion: false,
      fontSize: 'medium',
      colorMode: 'auto',
      keyboardNavigation: true,
      focusIndicators: true,
      clickDelay: 0,
      simplifiedInterface: false,
      showHelp: true,
      autoComplete: true,
      soundEffects: false,
      voiceNavigation: false,
      language: 'en',
      textDirection: 'ltr',
      culturalPreferences: {
        useLocalDateFormat: true,
        useLocalNumberFormat: true,
        useLocalCurrency: true
      }
    };

    const hasChangesFromDefault = Object.keys(state.settings).some(
      key => state.settings[key as keyof AccessibilitySettings] !== defaultSettings[key as keyof AccessibilitySettings]
    );

    setHasChanges(hasChangesFromDefault);
  }, [state.settings]);

  // Setting sections configuration
  const settingSections: SettingSection[] = [
    {
      id: 'visual',
      title: i18nService.translate('accessibility.visual.title'),
      description: i18nService.translate('accessibility.visual.description'),
      icon: Eye,
      settings: [
        {
          key: 'highContrast',
          type: 'toggle',
          label: i18nService.translate('accessibility.visual.highContrast'),
          description: i18nService.translate('accessibility.visual.highContrastDesc')
        },
        {
          key: 'fontSize',
          type: 'select',
          label: i18nService.translate('accessibility.visual.fontSize'),
          description: i18nService.translate('accessibility.visual.fontSizeDesc'),
          options: [
            { value: 'small', label: i18nService.translate('accessibility.fontSize.small') },
            { value: 'medium', label: i18nService.translate('accessibility.fontSize.medium') },
            { value: 'large', label: i18nService.translate('accessibility.fontSize.large') },
            { value: 'extra-large', label: i18nService.translate('accessibility.fontSize.extraLarge') }
          ]
        },
        {
          key: 'colorMode',
          type: 'select',
          label: i18nService.translate('accessibility.visual.colorMode'),
          description: i18nService.translate('accessibility.visual.colorModeDesc'),
          options: [
            { value: 'light', label: i18nService.translate('accessibility.colorMode.light') },
            { value: 'dark', label: i18nService.translate('accessibility.colorMode.dark') },
            { value: 'auto', label: i18nService.translate('accessibility.colorMode.auto') }
          ]
        },
        {
          key: 'reducedMotion',
          type: 'toggle',
          label: i18nService.translate('accessibility.visual.reducedMotion'),
          description: i18nService.translate('accessibility.visual.reducedMotionDesc')
        }
      ]
    },
    {
      id: 'motor',
      title: i18nService.translate('accessibility.motor.title'),
      description: i18nService.translate('accessibility.motor.description'),
      icon: MousePointer,
      settings: [
        {
          key: 'keyboardNavigation',
          type: 'toggle',
          label: i18nService.translate('accessibility.motor.keyboardNavigation'),
          description: i18nService.translate('accessibility.motor.keyboardNavigationDesc')
        },
        {
          key: 'focusIndicators',
          type: 'toggle',
          label: i18nService.translate('accessibility.motor.focusIndicators'),
          description: i18nService.translate('accessibility.motor.focusIndicatorsDesc')
        },
        {
          key: 'clickDelay',
          type: 'slider',
          label: i18nService.translate('accessibility.motor.clickDelay'),
          description: i18nService.translate('accessibility.motor.clickDelayDesc'),
          min: 0,
          max: 2000,
          step: 100
        }
      ]
    },
    {
      id: 'cognitive',
      title: i18nService.translate('accessibility.cognitive.title'),
      description: i18nService.translate('accessibility.cognitive.description'),
      icon: Brain,
      settings: [
        {
          key: 'simplifiedInterface',
          type: 'toggle',
          label: i18nService.translate('accessibility.cognitive.simplifiedInterface'),
          description: i18nService.translate('accessibility.cognitive.simplifiedInterfaceDesc')
        },
        {
          key: 'showHelp',
          type: 'toggle',
          label: i18nService.translate('accessibility.cognitive.showHelp'),
          description: i18nService.translate('accessibility.cognitive.showHelpDesc')
        },
        {
          key: 'autoComplete',
          type: 'toggle',
          label: i18nService.translate('accessibility.cognitive.autoComplete'),
          description: i18nService.translate('accessibility.cognitive.autoCompleteDesc')
        }
      ]
    },
    {
      id: 'audio',
      title: i18nService.translate('accessibility.audio.title'),
      description: i18nService.translate('accessibility.audio.description'),
      icon: Headphones,
      settings: [
        {
          key: 'soundEffects',
          type: 'toggle',
          label: i18nService.translate('accessibility.audio.soundEffects'),
          description: i18nService.translate('accessibility.audio.soundEffectsDesc')
        },
        {
          key: 'voiceNavigation',
          type: 'toggle',
          label: i18nService.translate('accessibility.audio.voiceNavigation'),
          description: i18nService.translate('accessibility.audio.voiceNavigationDesc')
        }
      ]
    }
  ];

  const handleSettingChange = (key: keyof AccessibilitySettings, value: any) => {
    actions.updateSettings({ [key]: value });
    actions.announce(
      i18nService.translate('accessibility.settingChanged', { 
        setting: i18nService.translate(`accessibility.${key}`)
      })
    );
  };

  const handleReset = () => {
    actions.resetToDefaults();
    setHasChanges(false);
    actions.announce(i18nService.translate('accessibility.settingsReset'));
  };

  const renderSettingControl = (setting: SettingSection['settings'][0]) => {
    const value = state.settings[setting.key];

    switch (setting.type) {
      case 'toggle':
        return (
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {setting.label}
              </label>
              <p className="text-xs text-muted-foreground">
                {setting.description}
              </p>
            </div>
            <Switch
              checked={value as boolean}
              onCheckedChange={(checked) => handleSettingChange(setting.key, checked)}
              aria-label={setting.label}
            />
          </div>
        );

      case 'select':
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">
              {setting.label}
            </label>
            <p className="text-xs text-muted-foreground">
              {setting.description}
            </p>
            <Select
              value={value as string}
              onValueChange={(newValue) => handleSettingChange(setting.key, newValue)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {setting.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'slider':
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium leading-none">
                {setting.label}
              </label>
              <span className="text-sm text-muted-foreground">
                {value as number}ms
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {setting.description}
            </p>
            <Slider
              value={[value as number]}
              onValueChange={([newValue]) => handleSettingChange(setting.key, newValue)}
              min={setting.min}
              max={setting.max}
              step={setting.step}
              className="w-full"
            />
          </div>
        );

      default:
        return null;
    }
  };

  const ColorModeIcon = () => {
    switch (state.settings.colorMode) {
      case 'light':
        return <Sun className="w-4 h-4" />;
      case 'dark':
        return <Moon className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      aria-label={i18nService.translate('accessibility.openMenu')}
    >
      <Settings className="w-4 h-4" />
      <span className="hidden sm:inline">
        {i18nService.translate('accessibility.title')}
      </span>
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      
      <DialogContent 
        className={cn('max-w-4xl max-h-[90vh] overflow-hidden', className)}
        id="accessibility-menu"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            {i18nService.translate('accessibility.title')}
            {hasChanges && (
              <Badge variant="secondary" className="ml-2">
                {i18nService.translate('accessibility.hasChanges')}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {i18nService.translate('accessibility.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6 max-h-[60vh] overflow-hidden">
          {/* Sidebar navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-2" role="tablist">
              {settingSections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors',
                      'hover:bg-accent hover:text-accent-foreground',
                      isActive && 'bg-accent text-accent-foreground'
                    )}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`${section.id}-panel`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{section.title}</span>
                  </button>
                );
              })}
            </nav>

            <Separator className="my-4" />

            {/* Quick actions */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                {i18nService.translate('accessibility.quickActions')}
              </h3>
              
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSettingChange('colorMode', 
                    state.settings.colorMode === 'dark' ? 'light' : 'dark'
                  )}
                  className="gap-2"
                >
                  <ColorModeIcon />
                  <span className="sr-only">
                    {i18nService.translate('accessibility.toggleColorMode')}
                  </span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentSize = state.settings.fontSize;
                    const sizes = ['small', 'medium', 'large', 'extra-large'] as const;
                    const currentIndex = sizes.indexOf(currentSize);
                    const nextIndex = (currentIndex + 1) % sizes.length;
                    handleSettingChange('fontSize', sizes[nextIndex]);
                  }}
                  className="gap-2"
                >
                  <ZoomIn className="w-4 h-4" />
                  <span className="sr-only">
                    {i18nService.translate('accessibility.increaseFontSize')}
                  </span>
                </Button>
              </div>

              <LanguageSwitcher 
                variant="compact" 
                showFlags={true}
                showLabels={false}
                className="w-full"
              />
            </div>
          </div>

          {/* Main content area */}
          <div className="lg:col-span-3 overflow-y-auto">
            {settingSections.map((section) => (
              <div
                key={section.id}
                id={`${section.id}-panel`}
                role="tabpanel"
                className={cn(
                  'space-y-6',
                  activeSection !== section.id && 'hidden'
                )}
                aria-labelledby={`${section.id}-tab`}
              >
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <section.icon className="w-5 h-5" />
                    {section.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {section.description}
                  </p>
                </div>

                <div className="space-y-6">
                  {section.settings.map((setting, index) => (
                    <Card key={`${setting.key}-${index}`}>
                      <CardContent className="pt-4">
                        {renderSettingControl(setting)}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Section-specific additional content */}
                {section.id === 'visual' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        {i18nService.translate('accessibility.visual.preview')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={cn(
                        'p-4 border rounded-md transition-all duration-200',
                        state.settings.highContrast && 'border-2 border-black bg-white text-black'
                      )}>
                        <h3 className="font-semibold mb-2">
                          {i18nService.translate('accessibility.visual.sampleText')}
                        </h3>
                        <p className="text-sm">
                          {i18nService.translate('accessibility.visual.sampleParagraph')}
                        </p>
                        <Button size="sm" className="mt-2">
                          {i18nService.translate('accessibility.visual.sampleButton')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {section.id === 'motor' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        {i18nService.translate('accessibility.motor.keyboardShortcuts')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Alt + C</span>
                          <span>{i18nService.translate('accessibility.shortcuts.skipToContent')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Alt + N</span>
                          <span>{i18nService.translate('accessibility.shortcuts.skipToNavigation')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Alt + A</span>
                          <span>{i18nService.translate('accessibility.shortcuts.openAccessibilityMenu')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Escape</span>
                          <span>{i18nService.translate('accessibility.shortcuts.closeDialog')}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="w-4 h-4" />
            <span>
              {i18nService.translate('accessibility.settingsSaved')}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                {i18nService.translate('accessibility.resetToDefaults')}
              </Button>
            )}
            
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="gap-2"
            >
              <Check className="w-4 h-4" />
              {i18nService.translate('common.done')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AccessibilityMenu;