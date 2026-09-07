const fs = require('fs');

const targetFile = 'src/components/modals/CreateClueModal.tsx';
let content = fs.readFileSync(targetFile, 'utf8');

// The new imports we need to add to lucide-react based on the TS errors
const requiredIcons = [
  'Lock', 'Check', 'Camera', 'Clapperboard', 'Palette', 'Lightbulb',
  'Pen', 'Search', 'Settings', 'Music', 'AlertTriangle', 'FileText',
  'Gamepad2', 'Users', 'Eye', 'Crystal', 'Thermometer', 'Square', 'Info'
];

// Extract the current lucide-react import
const lucideImportRegex = /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"];/;
const match = lucideImportRegex.exec(content);

if (match) {
  content = content.replace(lucideImportRegex, `import { ${requiredIcons.join(', ')} } from 'lucide-react';`);
  fs.writeFileSync(targetFile, content);
  console.log('Imports fixed in CreateClueModal.tsx');
} else {
  console.log('Could not find lucide-react import in CreateClueModal.tsx');
}
