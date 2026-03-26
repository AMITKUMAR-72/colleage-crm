const fs = require('fs');
const files = ['src/types/api.ts', 'src/components/LeadInbox.tsx', 'src/components/admin/ManualLeadEntryDrawer.tsx'];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf-8');
    // regex matching <<<<<<< HEAD\n(HEAD part)\n=======\n(remote part)\n>>>>>>> hash\n
    const regex = /<<<<<<< HEAD\r?\n([\s\S]*?)=======\r?\n[\s\S]*?>>>>>>> [0-9a-f]+\r?\n/g;
    content = content.replace(regex, '$1');
    fs.writeFileSync(file, content);
});
console.log('Successfully accepted HEAD for conflicts.');
