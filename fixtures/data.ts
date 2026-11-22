import type { Booking } from './schemas';

let counter = 0;

/** Unique, readable test data so parallel runs never collide. */
export function newBooking(overrides: Partial<Booking> = {}): Booking {
  counter += 1;
  return {
    firstname: 'QA',
    lastname: `Auto-${Date.now()}-${counter}`,
    totalprice: 150 + counter,
    depositpaid: true,
    bookingdates: { checkin: '2027-01-10', checkout: '2027-01-14' },
    additionalneeds: 'Breakfast',
    ...overrides,
  };
}
