/**
 * @fileoverview Pricing widget with booking CTA
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { NBCard } from './NBCard';
import { NBButton } from './NBButton';
import { IndianRupee, Calendar, Shield, AlertTriangle } from 'lucide-react';

/**
 * Shows pricing breakdown and booking CTA
 * @param {Object} props
 * @param {number} props.rentPerMonth - Monthly rent amount
 * @param {number} props.deposit - Security deposit amount
 * @param {number} props.disputeFee - Dispute fee amount
 * @param {Function} props.onBook - Booking handler function
 * @param {string} [props.className] - Additional CSS classes
 */
export function PricingWidget({ 
  rentPerMonth, 
  deposit, 
  disputeFee, 
  onBook, 
  className 
}) {
  const [duration, setDuration] = useState(6);
  const [showModal, setShowModal] = useState(false);

  const totalRent = rentPerMonth * duration;
  const totalAmount = totalRent + deposit + disputeFee;

  const handleBooking = () => {
    setShowModal(true);
  };

  const confirmBooking = () => {
    onBook({
      durationMonths: duration,
      totalAmount,
      breakdown: {
        rent: totalRent,
        deposit,
        disputeFee
      }
    });
    setShowModal(false);
  };

  return (
    <>
      <NBCard className={cn('sticky top-6', className)}>
        <div className="space-y-4">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center text-2xl font-display font-bold text-nb-ink">
              <IndianRupee className="w-6 h-6" />
              {rentPerMonth.toLocaleString()}
              <span className="text-base font-body font-normal text-nb-ink/70 ml-1">
                /month
              </span>
            </div>
          </div>

          {/* Duration Selector */}
          <div>
            <label className="block text-sm font-medium text-nb-ink mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Rental Duration
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-3 py-2 border-2 border-nb-ink rounded-nb bg-nb-bg text-nb-ink focus:outline-none focus:ring-4 focus:ring-nb-accent"
            >
              {Array.from({ length: 12 }, (_, i) => i + 3).map(months => (
                <option key={months} value={months}>
                  {months} month{months > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Pricing Breakdown */}
          <div className="space-y-3 pt-4 border-t-2 border-nb-ink/20">
            <div className="flex justify-between items-center">
              <span className="text-nb-ink">Rent ({duration} months)</span>
              <div className="flex items-center font-medium text-nb-ink">
                <IndianRupee className="w-4 h-4" />
                {totalRent.toLocaleString()}
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-nb-ink flex items-center">
                <Shield className="w-4 h-4 mr-1" />
                Security Deposit
              </span>
              <div className="flex items-center font-medium text-nb-ink">
                <IndianRupee className="w-4 h-4" />
                {deposit.toLocaleString()}
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-nb-ink flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1" />
                Dispute Fee
              </span>
              <div className="flex items-center font-medium text-nb-ink">
                <IndianRupee className="w-4 h-4" />
                {disputeFee.toLocaleString()}
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-3 border-t-2 border-nb-ink/20">
              <span className="font-display font-bold text-nb-ink">Total</span>
              <div className="flex items-center font-display font-bold text-lg text-nb-ink">
                <IndianRupee className="w-5 h-5" />
                {totalAmount.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-nb-accent/20 border-2 border-nb-accent rounded-nb p-3">
            <div className="flex items-center text-sm text-nb-ink">
              <span className="font-medium">Payment:</span>
              <span className="ml-1">BNB</span>
            </div>
            <div className="text-xs text-nb-ink/70 mt-1">
              Funds will be held in escrow until rental completion
            </div>
          </div>

          {/* Book Button */}
          <NBButton
            onClick={handleBooking}
            className="w-full"
            size="lg"
            data-testid="book-listing"
          >
            Book Now
          </NBButton>

        </div>
      </NBCard>

      {/* Booking Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-nb-ink/80 flex items-center justify-center z-50 p-4">
          <NBCard className="max-w-md w-full">
            <div className="space-y-4">
              <h3 className="font-display font-bold text-xl text-nb-ink">
                Confirm Booking
              </h3>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="font-medium">{duration} months</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <div className="flex items-center font-medium">
                    <IndianRupee className="w-4 h-4" />
                    {totalAmount.toLocaleString()}
                  </div>
                </div>
              </div>
              
              
              <div className="flex gap-3">
                <NBButton
                  variant="ghost"
                  onClick={() => setShowModal(false)}
                  className="flex-1"
                >
                  Cancel
                </NBButton>
                <NBButton
                  onClick={confirmBooking}
                  className="flex-1"
                >
                  Confirm Booking
                </NBButton>
              </div>
            </div>
          </NBCard>
        </div>
      )}
    </>
  );
}
