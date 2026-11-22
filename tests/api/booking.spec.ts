import { test, expect, APIRequestContext } from '@playwright/test';
import { AuthSchema, BookingIdListSchema, BookingSchema, CreatedBookingSchema } from '../../fixtures/schemas';
import { newBooking } from '../../fixtures/data';

// Public demo credentials documented by restful-booker (not secrets).
const ADMIN = { username: process.env.API_USER ?? 'admin', password: process.env.API_PASS ?? 'password123' };
const JSON_HEADERS = { Accept: 'application/json', 'Content-Type': 'application/json' };

async function getToken(request: APIRequestContext): Promise<string> {
  const res = await request.post('/auth', { data: ADMIN, headers: JSON_HEADERS });
  expect(res.status()).toBe(200);
  return AuthSchema.parse(await res.json()).token;
}

test.describe('Booking API @api', () => {
  test('health check responds', async ({ request }) => {
    const res = await request.get('/ping');
    expect(res.status()).toBe(201);
  });

  test('auth returns a token that matches the contract', async ({ request }) => {
    const token = await getToken(request);
    expect(token.length).toBeGreaterThan(10);
  });

  test('booking list matches the contract', async ({ request }) => {
    const res = await request.get('/booking', { headers: JSON_HEADERS });
    expect(res.status()).toBe(200);
    const parsed = BookingIdListSchema.safeParse(await res.json());
    expect(parsed.success, parsed.success ? '' : parsed.error.message).toBe(true);
  });

  test('full CRUD lifecycle keeps data consistent', async ({ request }) => {
    const token = await getToken(request);
    const auth = { ...JSON_HEADERS, Cookie: `token=${token}` };

    // Create
    const payload = newBooking();
    const created = await request.post('/booking', { data: payload, headers: JSON_HEADERS });
    expect(created.status()).toBe(200);
    const body = CreatedBookingSchema.parse(await created.json());
    expect(body.booking).toEqual(payload);
    const id = body.bookingid;

    // Read
    const read = await request.get(`/booking/${id}`, { headers: JSON_HEADERS });
    expect(read.status()).toBe(200);
    expect(BookingSchema.parse(await read.json())).toEqual(payload);

    // Full update
    const updatedPayload = newBooking({ firstname: 'Updated', totalprice: 999 });
    const put = await request.put(`/booking/${id}`, { data: updatedPayload, headers: auth });
    expect(put.status()).toBe(200);
    expect(BookingSchema.parse(await put.json())).toEqual(updatedPayload);

    // Partial update
    const patch = await request.patch(`/booking/${id}`, { data: { additionalneeds: 'Late checkout' }, headers: auth });
    expect(patch.status()).toBe(200);
    expect((await patch.json()).additionalneeds).toBe('Late checkout');

    // Delete, then confirm it is gone
    const del = await request.delete(`/booking/${id}`, { headers: auth });
    expect(del.status()).toBe(201);
    const gone = await request.get(`/booking/${id}`, { headers: JSON_HEADERS });
    expect(gone.status()).toBe(404);
  });

  test('filter by name returns the created booking', async ({ request }) => {
    const payload = newBooking();
    const created = CreatedBookingSchema.parse(
      await (await request.post('/booking', { data: payload, headers: JSON_HEADERS })).json(),
    );
    const res = await request.get('/booking', {
      params: { firstname: payload.firstname, lastname: payload.lastname },
      headers: JSON_HEADERS,
    });
    const ids = BookingIdListSchema.parse(await res.json()).map((b) => b.bookingid);
    expect(ids).toContain(created.bookingid);
  });
});

test.describe('Booking API negative cases @api', () => {
  test('unknown booking returns 404', async ({ request }) => {
    const res = await request.get('/booking/999999999', { headers: JSON_HEADERS });
    expect(res.status()).toBe(404);
  });

  test('update without a token is forbidden', async ({ request }) => {
    const res = await request.put('/booking/1', { data: newBooking(), headers: JSON_HEADERS });
    expect(res.status()).toBe(403);
  });

  test('delete without a token is forbidden', async ({ request }) => {
    const res = await request.delete('/booking/1', { headers: JSON_HEADERS });
    expect(res.status()).toBe(403);
  });

  test('auth with wrong password gives no token', async ({ request }) => {
    const res = await request.post('/auth', { data: { username: 'admin', password: 'wrong' }, headers: JSON_HEADERS });
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ reason: 'Bad credentials' });
  });
});
