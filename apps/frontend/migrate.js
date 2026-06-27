import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

walkDir('src/components', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Replace next/link
    content = content.replace(/import Link from ['"]next\/link['"];?/g, "import { Link } from 'react-router-dom';");

    // Replace next/navigation
    content = content.replace(/import \{.*?\} from ['"]next\/navigation['"];?/g, (match) => {
      return "import { useNavigate as useRouter, useLocation as usePathname, useSearchParams } from 'react-router-dom';";
    });

    // Replace next/dynamic
    content = content.replace(/import dynamic from ['"]next\/dynamic['"];?/g, "import React, { lazy, Suspense } from 'react';");
    
    // Quick fix for dynamic() usage
    content = content.replace(/const (\w+) = dynamic\(\(\) => import\((.*?)\), \{.*?loading: \(\) => (.*?) \}\);/g, 
      "const $1_Lazy = lazy(() => import($2));\nconst $1 = (props: any) => <Suspense fallback={$3}><$1_Lazy {...props} /></Suspense>;");

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  }
});
