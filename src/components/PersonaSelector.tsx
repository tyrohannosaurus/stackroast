import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { ROAST_PERSONAS, type PersonaKey } from '@/lib/roastPersonas';
import { ChevronDown } from 'lucide-react';

interface PersonaSelectorProps {
  selectedPersona: PersonaKey | 'random';
  onSelect: (persona: PersonaKey | 'random') => void;
  disabled?: boolean;
}

const PERSONA_EMOJIS: Record<PersonaKey | 'random', string> = {
  cynical_senior: '👴',
  silicon_valley_vc: '💼',
  rust_evangelist: '🦀',
  linux_purist: '🐧',
  startup_founder: '🚀',
  security_expert: '🔒',
  random: '🎲',
};

const PERSONA_DESCRIPTIONS: Record<PersonaKey | 'random', string> = {
  cynical_senior: 'Battle-hardened engineer who\'s seen it all',
  silicon_valley_vc: 'Only cares about scale and buzzwords',
  rust_evangelist: 'Everything should be rewritten in Rust',
  linux_purist: 'If it\'s not open source, it\'s not real',
  startup_founder: 'Move fast, break things, raise money',
  security_expert: 'Finds vulnerabilities in everything',
  random: 'Let fate decide your roaster',
};

export function PersonaSelector({ selectedPersona, onSelect, disabled }: PersonaSelectorProps) {
  const getDisplayName = (key: PersonaKey | 'random') => {
    if (key === 'random') return 'Random Roaster';
    return ROAST_PERSONAS[key]?.name || key;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={disabled}
          className="gap-2 min-w-[180px] justify-between"
        >
          <span className="flex items-center gap-2">
            <span>{PERSONA_EMOJIS[selectedPersona]}</span>
            <span className="truncate">{getDisplayName(selectedPersona)}</span>
          </span>
          <ChevronDown className="w-4 h-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[280px]">
        <DropdownMenuLabel>Choose Your Roaster</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Random option */}
        <DropdownMenuItem 
          onClick={() => onSelect('random')}
          className="flex items-start gap-3 py-3 cursor-pointer"
        >
          <span className="text-xl">{PERSONA_EMOJIS.random}</span>
          <div className="flex flex-col">
            <span className="font-medium">Random Roaster</span>
            <span className="text-xs text-muted-foreground">{PERSONA_DESCRIPTIONS.random}</span>
          </div>
          {selectedPersona === 'random' && (
            <span className="ml-auto text-orange-500">✓</span>
          )}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Persona options */}
        {(Object.keys(ROAST_PERSONAS) as PersonaKey[]).map((key) => (
          <DropdownMenuItem 
            key={key}
            onClick={() => onSelect(key)}
            className="flex items-start gap-3 py-3 cursor-pointer"
          >
            <span className="text-xl">{PERSONA_EMOJIS[key]}</span>
            <div className="flex flex-col">
              <span className="font-medium">{ROAST_PERSONAS[key].name}</span>
              <span className="text-xs text-muted-foreground">{PERSONA_DESCRIPTIONS[key]}</span>
            </div>
            {selectedPersona === key && (
              <span className="ml-auto text-orange-500">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
