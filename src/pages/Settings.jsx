import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getSettings, updateSettings } from '@/lib/sessionStore';
import { ArrowLeft, Globe, Mail, Phone, Volume2, Moon, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const LANGUAGES = [
  { code: 'EN', label: 'English' },
  { code: 'DE', label: 'Deutsch' },
  { code: 'PT', label: 'Português' },
  { code: 'ES', label: 'Español' },
  { code: 'FR', label: 'Français' },
  { code: 'IT', label: 'Italiano' },
  { code: 'NL', label: 'Nederlands' },
  { code: 'JP', label: '日本語' },
];

const rowStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '0.75rem',
  padding: '1rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

export default function Settings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(getSettings());

  const update = (key, value) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    updateSettings({ [key]: value });
  };

  const pageStyle = {
    background: 'radial-gradient(ellipse at 20% 50%, rgba(13,40,44,0.9) 0%, rgba(8,8,16,1) 50%, rgba(28,10,25,0.85) 100%)',
    minHeight: '100vh',
  };

  const rows = [
    {
      icon: <Globe className="w-4 h-4 text-primary" />,
      label: 'Language',
      control: (
        <Select value={settings.language} onValueChange={(v) => update('language', v)}>
          <SelectTrigger className="w-28 h-8 text-xs bg-white/5 border-white/10 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map(l => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}
          </SelectContent>
        </Select>
      ),
    },
    {
      icon: <Mail className="w-4 h-4 text-primary" />,
      label: 'Email Language',
      control: (
        <Select value={settings.emailLanguage} onValueChange={(v) => update('emailLanguage', v)}>
          <SelectTrigger className="w-28 h-8 text-xs bg-white/5 border-white/10 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map(l => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}
          </SelectContent>
        </Select>
      ),
    },
    {
      icon: <Phone className="w-4 h-4 text-secondary" />,
      label: 'Channel',
      control: (
        <Select value={settings.channel} onValueChange={(v) => update('channel', v)}>
          <SelectTrigger className="w-28 h-8 text-xs bg-white/5 border-white/10 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Phone">Phone</SelectItem>
            <SelectItem value="Chat">Chat</SelectItem>
            <SelectItem value="Email">Email</SelectItem>
          </SelectContent>
        </Select>
      ),
    },
    {
      icon: <Volume2 className="w-4 h-4 text-white/50" />,
      label: 'Sound',
      control: <Switch checked={settings.sound} onCheckedChange={(v) => update('sound', v)} />,
    },
    {
      icon: <Moon className="w-4 h-4 text-white/50" />,
      label: 'Dark Mode',
      control: (
        <Switch
          checked={settings.darkMode}
          onCheckedChange={(v) => {
            update('darkMode', v);
            document.documentElement.classList.toggle('light', !v);
          }}
        />
      ),
    },
    {
      icon: <Sparkles className="w-4 h-4 text-accent" />,
      label: 'Animations',
      control: <Switch checked={settings.animations} onCheckedChange={(v) => update('animations', v)} />,
    },
  ];

  return (
    <div style={pageStyle} className="pt-14 pb-10 px-5">
      <div className="max-w-md mx-auto space-y-5 pt-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-white/40 hover:text-white/70 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h2 className="text-base font-semibold text-white">Settings</h2>
        </div>

        <div className="space-y-2">
          {rows.map((row, i) => (
            <motion.div
              key={row.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={rowStyle}
            >
              <div className="flex items-center gap-3">
                {row.icon}
                <Label className="text-sm text-white/80 cursor-pointer">{row.label}</Label>
              </div>
              {row.control}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}