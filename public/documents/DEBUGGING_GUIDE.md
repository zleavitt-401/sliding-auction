# Debugging Guide - Lightweight Stacks

Quick reference for debugging zero-build JavaScript projects (vanilla JS, React CDN, Firebase, Vercel, Chrome extensions).

**Note**: Examples use Fauxbituaries project references but patterns apply to any similar architecture.

---

## Debugging Approach

**Hermeneutic Circle** - alternate between details and big picture:
1. Examine specific error
2. Zoom out to system context
3. Dive into related code
4. Return to error with new understanding
5. Repeat until resolved

**For complex multi-system issues**: Use systematic 12-step process (see Evidence-Based Debugging section below)

---

## Quick Error Fixes

### Module Errors
```
Cannot use import statement outside a module
```
→ Add `type="module"` to script tag

### Reference Errors
```
X is not defined
```
→ Check script load order, verify exports/imports

### CORS Errors
```
Blocked by CORS policy
```
→ Check API allows your origin, verify headers

### React CDN (No JSX)
```javascript
// ❌ No JSX compiler
const App = () => <div>Hello</div>;

// ✅ Use createElement
const App = () => React.createElement('div', null, 'Hello');
```

### Firebase Permission Denied
→ Check Firestore security rules, verify auth state, confirm path

### Vercel 404
→ Check Root Directory setting, verify index.html committed, add rewrites for SPA:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Chrome Extension Not Loading
→ Verify manifest.json syntax, check `chrome://extensions` errors

### Canvas Not Updating
→ Set internal size (`canvas.width/height`), check z-index, verify drawing on visible area

---

## Evidence-Based Debugging (Complex Issues)

### When to Use
- Multi-component issues (localStorage + Firebase + cache)
- Data synchronization problems
- Intermittent failures
- Issues affecting multiple browsers
- When quick fixes haven't worked after 30 minutes

### Quick Start Diagnostic
```javascript
console.log('🔍 PROBLEM INVESTIGATION');
console.log('========================');

// Check system state
console.log('Feature status:', typeof window.mainFeature !== 'undefined');
console.log('DOM ready:', document.querySelector('.main-element') !== null);

// Check data
const data = localStorage.getItem('storage_key');
console.log('Data exists:', data !== null);
console.log('Data format:', Array.isArray(JSON.parse(data || '[]')) ? 'Array' : 'Object');

// Check console for red errors above
```

### Theory Formation with Confidence Levels

**High Confidence (80%+)**:
- Console errors directly point to problem
- Consistent reproduction
- Clear correlation

**Medium Confidence (50-80%)**:
- Symptoms match known patterns
- Some evidence, not definitive
- Multiple potential causes

**Low Confidence (30-50%)**:
- Vague symptoms
- Limited evidence
- Requires elimination

Example:
```javascript
// Theory A: Data not syncing (75% confidence)
console.log('🧪 TESTING THEORY A');

const sourceData = JSON.parse(localStorage.getItem('source') || '{}');
const targetData = JSON.parse(localStorage.getItem('target') || '[]');

console.log('Source has data:', Object.keys(sourceData).length);
console.log('Target has data:', targetData.length);

if (Object.keys(sourceData).length > 0 && targetData.length === 0) {
  console.log('✅ THEORY A CONFIRMED: Sync not happening');
}
```

---

## Critical Patterns

### Pattern 1: Dual Storage Conflicts (localStorage + Firebase)

**Problem**: Changes disappear after refresh

**Solution**:
```javascript
// ALWAYS save with timestamp
function saveData(data) {
  const timestamp = new Date().toISOString();
  localStorage.setItem('data', JSON.stringify(data));
  localStorage.setItem('data_timestamp', timestamp);
  
  firebase.ref('data').set({ data, timestamp });
}

// Load with priority check
function loadData() {
  const localTime = localStorage.getItem('data_timestamp');
  
  firebase.ref('data').once('value', (snapshot) => {
    const firebaseData = snapshot.val();
    const firebaseTime = firebaseData?.timestamp;
    
    // Newer wins
    if (localTime && firebaseTime && new Date(localTime) > new Date(firebaseTime)) {
      console.log('✅ LOCAL newer - preserving changes');
      return;
    }
    
    localStorage.setItem('data', JSON.stringify(firebaseData));
  });
}
```

### Pattern 2: Cache Key Inconsistencies

**Problem**: Different formats cause mismatches

**Solution**:
```javascript
// Single source of truth
function createCacheKey(name, source) {
  const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normalizedSource = (source || 'unknown').toLowerCase();
  return `${normalizedName}_${normalizedSource}`;
}

// Use EVERYWHERE in your codebase
```

### Pattern 3: Sync Operations Overwriting User Data

**Problem**: Automatic sync erases admin changes

**Solution**:
```javascript
// ✅ Preserve existing data
function syncData(cache, targetData) {
  cache.forEach((value, key) => {
    if (targetData[key]) {
      console.log(`✅ PRESERVING existing value for ${key}`);
      return; // Skip if already set
    }
    targetData[key] = value; // Only fill missing
  });
}
```

### Pattern 4: Safari-Specific Issues

Safari breaks first due to stricter CORS, cookies, localStorage behavior.

**Solutions**:
```javascript
// Firebase config
const firebaseConfig = {
  databaseURL: 'https://your-project.firebaseio.com',
  authDomain: 'your-project.firebaseapp.com', // Required for Safari
};

// Fetch with Safari compatibility
fetch(url, {
  mode: 'cors',
  credentials: 'include', // Safari needs this
});
```

### Pattern 5: Data Structure Migrations

**Problem**: Adding fields breaks old data

**Solution**:
```javascript
function loadWithMigration() {
  let data = JSON.parse(localStorage.getItem('data') || '{}');
  
  // Detect old format
  Object.keys(data).forEach(key => {
    if (typeof data[key] === 'string') {
      // Migrate to new format
      data[key] = {
        value: data[key],
        timestamp: new Date().toISOString()
      };
      console.log(`Migrated ${key}`);
    }
  });
  
  localStorage.setItem('data', JSON.stringify(data));
  return data;
}
```

---

## Diagnostic Console Commands

### System Status
```javascript
function quickDiagnostic() {
  console.log('🔍 SYSTEM STATUS');
  console.log('Page loaded:', document.readyState);
  console.log('localStorage works:', typeof Storage !== 'undefined');
  console.log('Network:', navigator.onLine ? 'Online' : 'Offline');
  
  // Check storage usage
  const keys = Object.keys(localStorage);
  console.log('Storage keys:', keys.length);
  keys.forEach(key => {
    const size = localStorage.getItem(key).length;
    console.log(`  ${key}: ${(size/1024).toFixed(2)}KB`);
  });
}

quickDiagnostic();
```

### Data Inspector
```javascript
function inspectData(storageKey) {
  const data = localStorage.getItem(storageKey);
  if (!data) {
    console.log(`❌ No data: ${storageKey}`);
    return;
  }
  
  const parsed = JSON.parse(data);
  console.log(`📊 ${storageKey}:`);
  console.log(`   Type: ${Array.isArray(parsed) ? 'Array' : 'Object'}`);
  console.log(`   Entries: ${Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length}`);
  console.log(`   Sample:`, parsed[0] || parsed[Object.keys(parsed)[0]]);
}
```

### Compare Storage Sources
```javascript
function compareStorageSources() {
  const source = JSON.parse(localStorage.getItem('source_key') || '[]');
  const target = JSON.parse(localStorage.getItem('target_key') || '[]');
  
  console.log('📋 STORAGE COMPARISON');
  console.log('Source entries:', source.length);
  console.log('Target entries:', target.length);
  
  // Find mismatches
  source.forEach(item => {
    const found = target.some(t => t.id === item.id);
    if (!found) {
      console.log(`⚠️ Missing in target: ${item.id}`);
    }
  });
}
```

### Timestamp Check
```javascript
function checkTimestamps() {
  console.log('🕐 TIMESTAMP CHECK');
  
  const localTime = localStorage.getItem('data_timestamp');
  console.log('Local timestamp:', localTime);
  console.log('Age:', localTime ? `${Math.round((Date.now() - new Date(localTime)) / 1000 / 60)} minutes` : 'N/A');
}
```

---

## Debugging Workflow

### 1. Identify Error Location
- **Console (F12)**: Stack trace, file/line number
- **Network tab**: Failed requests, verify payloads
- **Application tab**: localStorage, Firebase cache

### 2. Reproduce Consistently
- Test different browsers (Chrome, Safari, Firefox)
- Try incognito mode
- Clear cache and reload

### 3. Isolate Problem
```javascript
// Strategic logging
console.log('Function called with:', { param1, param2 });
console.log('API response:', response);
console.log('Parsed data:', data);

// Temporary returns to test
async function complexFunction() {
  const step1 = await doThing();
  console.log('Step 1 done:', step1);
  // return step1; // Test if error happens after this
}
```

### 4. Check Common Issues
- **"undefined" errors**: Variable declared? In scope? Async complete?
- **"not a function" errors**: Spelling? Object has method? Module imported?
- **Rendering issues**: CSS? DOM exists? Content loaded?

### 5. Zoom Out to Architecture
- How does this fit in overall app?
- What data flows into this function?
- Side effects?
- Timing/race conditions?

---

## Environment Variables

**Vite projects:**
```javascript
// Access via import.meta.env
const apiKey = import.meta.env.VITE_API_KEY;
```

**Static sites:**
- Can't use env vars directly
- Inject at build or hardcode (careful with keys)

**Vercel:**
- Set in dashboard: Settings → Environment Variables
- Must redeploy after adding

---

## When Debugging Stalls

**After 2 hours with no progress:**
1. Document what you know
2. Document what you don't know
3. Take a break
4. Return with fresh perspective

**If solutions keep breaking things:**
- Step back to simpler approach
- Verify root cause is correct
- Check if fixing symptoms not cause

**If can't reproduce consistently:**
- Likely timing/race condition
- Add more logging
- Test with throttled network (DevTools)

---

## Success Metrics

**Good session:**
- ✅ Root cause found within 2 hours
- ✅ Solution addresses core issue
- ✅ Minimal side effects
- ✅ Problem doesn't recur

**Red flags:**
- ❌ >4 hours with no progress
- ❌ Solutions break other things
- ❌ Can't reproduce consistently
- ❌ Evidence contradicts itself

---

*For zero-build JavaScript: vanilla JS, React CDN, Firebase, Vercel, Chrome extensions*
