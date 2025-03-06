import fs from 'fs';
import path from 'path';

const packageJsonPath = path.resolve(new URL('.', import.meta.url).pathname, '../package.json');
const distPackageJsonPath = path.resolve(new URL('.', import.meta.url).pathname, '../dist/package.json');

try {
  // Read the current package.json
  const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const distPackageData = JSON.parse(fs.readFileSync(distPackageJsonPath, 'utf8'));

  // Prepare the new package.json structure
  const newDistPackageData = {
    ...distPackageData,
    version: packageData.version,
    name: packageData.name,
    keywords:  packageData.keywords,
    description: packageData.description,
    // Uncomment the lines below if you want to include more fields
    // name: packageData.name,
    // main: packageData.main, // Adjust as needed for your use case
    // Add any other fields needed in your dist package.json
  };

  // Write the package.json with the current version into the dist folder
  fs.writeFileSync(distPackageJsonPath, JSON.stringify(newDistPackageData, null, 2));

  console.log('package.json copied to dist with updated version', newDistPackageData.version);
} catch (error) {
  console.error('Error occurred while copying package.json:', error.message);
}
