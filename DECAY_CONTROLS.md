# Enhanced Decay Controls Implementation

## Status: Code Complete, UI Not Displaying

The enhanced decay controls have been implemented in the codebase but are not currently appearing in the UI. This document details what was implemented and troubleshooting steps for later.

---

## What Was Implemented

### 1. Exponential Decay - Steepness Slider

**Location:** `public/js/components/AuctionForm.js` (lines 563-593)

- Slider control (0-100) with descriptive labels
- Labels: Very Gentle, Gentle, Moderate, Steep, Very Steep
- Logarithmic interpolation maps slider to decay rates (0.00002 - 0.002)
- Contextual hints explain each steepness level

**How it works:**
- Gentle (0-30): Price drops slowly throughout, reaching floor near the end
- Moderate (31-70): Balanced curve with moderate initial drop, gradual slowdown
- Aggressive (71-100): Price drops quickly at first, then levels off near floor

### 2. Stepped Decay - Step Count Control

**Location:** `public/js/components/AuctionForm.js` (lines 595-684)

- Number of steps slider with:
  - Minimum: 4 steps
  - Maximum: duration in minutes (dynamic)
- Visual summary showing "Price drops every X" and "Drop amount: $Y"
- Optional manual override checkbox for custom:
  - Step interval (in seconds)
  - Step amount (in dollars)

### 3. Live Preview Graph

**Location:** `public/js/components/AuctionForm.js` (lines 686-733)

- SVG-based real-time visualization
- Updates as user adjusts any pricing parameter
- Shows price curve (blue) and floor price line (red dashed)
- Only appears when starting price > floor price

### 4. Backend Support

**Cloud Function:** `functions/updateAuctionPrice.js` (lines 200-208)
- Now uses `stepCount` field from pricingConfig
- Falls back to calculating from stepInterval if not provided

**Client Calculations:** `public/js/utils/priceCalculations.js` (lines 58-66)
- Mirrors server logic with stepCount support

### 5. CSS Styles

**Location:** `public/css/admin.css` (lines 1322-1483)

New classes added:
- `.decay-parameters` - Container for decay controls
- `.steepness-slider` - Flexbox layout for slider with labels
- `.steepness-label` - Highlighted label showing current value
- `.step-summary` - Shows interval and amount summary
- `.form-checkbox` - Styled checkbox for manual override
- `.decay-preview` - Container for preview graph
- `.decay-graph` - SVG styling
- `.decay-preview__legend` - Legend styling

Mobile responsive styles included (max-width: 767px).

---

## State Variables Added

```javascript
// Exponential decay steepness (0 = gentle, 100 = aggressive)
const [expSteepness, setExpSteepness] = useState(50);

// Stepped decay parameters
const [stepCount, setStepCount] = useState(10);
const [stepInterval, setStepInterval] = useState(null); // null = auto-calculate
const [stepAmount, setStepAmount] = useState(null); // null = auto-calculate
const [useManualSteps, setUseManualSteps] = useState(false);
```

---

## Helper Functions Added

1. `calculateExpDecayRate(steepness, startPrice, floorPrice, duration)` - Converts slider value to decay rate
2. `generatePreviewPoints()` - Generates 50 points for the SVG graph
3. `getSteepnessLabel(value)` - Returns label like "Moderate" for slider value
4. `getStepSummary()` - Returns `{ interval, amount, count }` for display

---

## Data Saved to Firestore

When creating an auction with exponential decay:
```javascript
pricingConfig: {
  formula: 'exponential',
  decayRate: 0.000316..., // Calculated from steepness
  steepness: 50           // Original slider value for reference
}
```

When creating an auction with stepped decay:
```javascript
pricingConfig: {
  formula: 'stepped',
  stepCount: 10,
  stepInterval: 180,      // seconds
  stepAmount: 500         // cents
}
```

---

## Troubleshooting

### Issue: Controls not appearing in UI

**Possible causes:**

1. **Browser caching** - Try hard refresh (Cmd+Shift+R / Ctrl+Shift+R)

2. **Firebase Hosting not redeployed** - If viewing deployed site:
   ```bash
   firebase deploy --only hosting
   ```

3. **Need to select correct formula** - Controls only appear when:
   - Pricing Mode = "Transparent (Formula-based)"
   - Price Formula = "Exponential Decay" or "Stepped Decay"

4. **Preview graph requires prices** - The graph only shows when:
   - Starting Price is entered
   - Floor Price is entered
   - Starting Price > Floor Price

5. **Check browser console for errors** - Open DevTools (F12) and check Console tab

6. **Verify file is being loaded** - In DevTools Network tab, check that `AuctionForm.js` is loading the latest version (check file size or add `?v=2` to import)

### Quick Test

To verify the code is present, run in browser console on the Create Auction page:
```javascript
// Should return the AuctionForm function if loaded
console.log(typeof AuctionForm);
```

---

## Files Modified

| File | Changes |
|------|---------|
| `public/js/components/AuctionForm.js` | +220 lines: state, helpers, UI controls |
| `functions/updateAuctionPrice.js` | +3 lines: stepCount support |
| `public/js/utils/priceCalculations.js` | +3 lines: stepCount support |
| `public/css/admin.css` | +160 lines: new component styles |

---

## Commit

```
99faa48 Add enhanced decay controls for auction pricing
```

Pushed to `origin/master` on 2024-11-24.
