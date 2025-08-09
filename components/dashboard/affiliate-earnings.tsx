"use client";

// Minimal placeholder component for affiliate earnings dashboard section.
// Expand with real data fetching and charts once core build stabilizes.
import React from 'react';

export interface AffiliateEarningsProps {
	total?: number; // total earnings in base currency
	pending?: number; // pending (not yet paid)
	currency?: string; // currency code, defaults to USD
}

export const AffiliateEarnings: React.FC<AffiliateEarningsProps> = ({
	total = 0,
	pending = 0,
	currency = 'USD',
}) => {
	const formattedTotal = new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(total);
	const formattedPending = new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(pending);

	return (
		<section className="flex flex-col gap-4 rounded-md border p-4 bg-background/40">
			<header>
				<h2 className="text-lg font-semibold">Affiliate Earnings</h2>
				<p className="text-xs text-muted-foreground">Basic summary (placeholder)</p>
			</header>
			<div className="grid grid-cols-2 gap-4 text-sm">
				<div className="flex flex-col">
					<span className="text-muted-foreground">Total</span>
					<span className="font-medium" data-testid="affiliate-total">{formattedTotal}</span>
				</div>
				<div className="flex flex-col">
					<span className="text-muted-foreground">Pending</span>
					<span className="font-medium" data-testid="affiliate-pending">{formattedPending}</span>
				</div>
			</div>
			<footer className="text-[10px] text-muted-foreground/80">
				Detailed referral stats, graphs, and payout history will appear once implemented.
			</footer>
		</section>
	);
};

export default AffiliateEarnings;
