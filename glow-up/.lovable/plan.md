

# Fix: Client list showing only 1,000 of 1,746 clients

## Problem
Supabase/PostgREST has a default limit of 1,000 rows per query. The `useClients` hook fetches all clients without pagination, so it silently truncates at 1,000.

## Solution
Implement paginated fetching in `useClients.ts` to retrieve ALL clients by making multiple requests in batches of 1,000 until all rows are returned.

## Technical Details

**File: `src/hooks/useClients.ts`**

Update the `queryFn` to loop and fetch in pages of 1,000:

```typescript
queryFn: async () => {
  const PAGE_SIZE = 1000;
  let allData: Client[] = [];
  let from = 0;
  let hasMore = true;
  
  while (hasMore) {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", tenantUserId!)
      .order("last_name", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    allData = allData.concat(data as Client[]);
    hasMore = (data?.length ?? 0) === PAGE_SIZE;
    from += PAGE_SIZE;
  }
  
  return allData;
},
```

This fetches in batches of 1,000 until fewer than 1,000 rows are returned, ensuring all 1,746 clients are loaded.

