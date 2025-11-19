# Client-Side Price Updates Plan

## Problem
Cloud Functions `updateAuctionPrice` runs every 1 minute (Cloud Scheduler minimum).
This makes price changes feel very slow and chunky.

## Solution Options

### Option 1: Client-Side Price Interpolation (Recommended)
**Approach**: Calculate expected price on client-side between server updates

**Pros**:
- Smooth, continuous price display
- No additional Cloud Function costs
- Works with existing 1-minute server updates
- Server remains authoritative

**Cons**:
- Price shown might drift slightly from server calculation
- Needs re-sync when server update arrives

**Implementation**:
1. Client calculates expected price using same formula as server
2. Updates display every second locally
3. When server update arrives, sync to server price
4. Use server timestamp to calculate elapsed time

### Option 2: Decrease Schedule Interval with Cloud Run
**Approach**: Move updateAuctionPrice to Cloud Run, trigger every 1 second

**Pros**:
- Server remains single source of truth
- Exact pricing calculation

**Cons**:
- More expensive (60x more function invocations)
- Cloud Run setup complexity
- Still network latency for price updates

### Option 3: Hybrid Approach
**Approach**: Server updates every 10-15 seconds, client interpolates between

**Pros**:
- Balance between cost and accuracy
- Smoother than 1 minute updates

**Cons**:
- Cloud Scheduler doesn't support < 1 minute intervals
- Would need Cloud Run anyway

## Recommendation

**Use Option 1: Client-Side Interpolation**

The price formulas are deterministic and transparent. We can calculate the expected price client-side and sync with server periodically.

### Implementation Steps

1. Create `calculateExpectedPrice()` utility function
   - Mirror server-side formula logic (linear, exponential, stepped)
   - Use client time + auction start time to calculate elapsed seconds
   
2. Modify `useAuction` hook to interpolate prices
   - Calculate expected price every second
   - Display interpolated price
   - Sync to server price when Firestore update arrives
   
3. Add visual indicator when syncing
   - Show "⟳" icon briefly when server update arrives
   
4. Keep server as source of truth
   - Server continues updating every 1 minute
   - Client never writes price to Firestore
   - On mount/refresh, use server price as baseline

### Code Changes

**New file**: `public/js/utils/priceCalculations.js`
```javascript
export function calculateExpectedPrice(auction) {
  const now = Date.now();
  const startTime = auction.startTime?.toMillis ? auction.startTime.toMillis() : auction.startTime;
  const elapsedSeconds = Math.floor((now - startTime) / 1000);
  
  if (auction.pricingMode === 'transparent') {
    return calculateTransparentPrice(auction, elapsedSeconds);
  } else {
    // For algorithmic mode, can't predict viewer/shield counts
    // Fall back to last server price
    return auction.currentPrice;
  }
}

function calculateTransparentPrice(auction, elapsedSeconds) {
  // Same logic as server-side
  const { startingPrice, floorPrice, duration, pricingConfig } = auction;
  const formula = pricingConfig?.formula || 'linear';
  
  switch (formula) {
    case 'linear':
      const linearRate = (startingPrice - floorPrice) / duration;
      const linearPrice = startingPrice - (linearRate * elapsedSeconds);
      return Math.max(floorPrice, Math.round(linearPrice));
    
    case 'exponential':
      const expRate = pricingConfig.decayRate || 0.0001;
      const expPrice = startingPrice * Math.exp(-expRate * elapsedSeconds);
      return Math.max(floorPrice, Math.round(expPrice));
    
    case 'stepped':
      const stepInterval = pricingConfig.stepInterval || 30;
      const stepAmount = pricingConfig.stepAmount || Math.floor((startingPrice - floorPrice) / 10);
      const numSteps = Math.floor(elapsedSeconds / stepInterval);
      const steppedPrice = startingPrice - (stepAmount * numSteps);
      return Math.max(floorPrice, steppedPrice);
    
    default:
      return auction.currentPrice;
  }
}
```

**Modify**: `public/js/hooks/useAuction.js`
```javascript
// Add state for interpolated price
const [displayPrice, setDisplayPrice] = useState(auction?.currentPrice);

// Interpolate price every second for transparent mode
useEffect(() => {
  if (!auction || auction.pricingMode !== 'transparent' || auction.status !== 'live') {
    setDisplayPrice(auction?.currentPrice);
    return;
  }
  
  const interval = setInterval(() => {
    const expected = calculateExpectedPrice(auction);
    setDisplayPrice(expected);
  }, 1000);
  
  return () => clearInterval(interval);
}, [auction]);

// Sync to server price when it updates
useEffect(() => {
  if (auction?.currentPrice) {
    setDisplayPrice(auction.currentPrice);
  }
}, [auction?.currentPrice]);
```

## Testing Plan

1. Create auction with linear pricing, 5 minute duration
2. Start auction, verify price decreases smoothly every second
3. Wait for server update (1 minute mark), verify sync
4. Test with exponential and stepped formulas
5. Test with algorithmic mode (should use server price only)

## Future Enhancements

- Add "last synced" indicator
- Detect drift and re-sync more frequently if needed
- Add websocket for sub-second updates (future)
