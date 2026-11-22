import { z } from 'zod';

// API contract for https://restful-booker.herokuapp.com, written from its public docs.
// A response that drifts from this shape fails the test: the same "contract mismatch"
// check that catches backend changes before they reach the UI.

export const BookingSchema = z.object({
  firstname: z.string(),
  lastname: z.string(),
  totalprice: z.number(),
  depositpaid: z.boolean(),
  bookingdates: z.object({
    checkin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    checkout: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
  additionalneeds: z.string().optional(),
});

export const CreatedBookingSchema = z.object({
  bookingid: z.number().int().positive(),
  booking: BookingSchema,
});

export const BookingIdListSchema = z.array(z.object({ bookingid: z.number().int() }));

export const AuthSchema = z.object({ token: z.string().min(10) });

export type Booking = z.infer<typeof BookingSchema>;
