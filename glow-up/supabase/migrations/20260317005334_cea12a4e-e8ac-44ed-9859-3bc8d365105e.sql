-- Fix Pinuccia's account: remove wrongly assigned 'user' role and salon profile
DELETE FROM public.user_roles WHERE user_id = '8ab5f378-540a-4003-b47f-d7c9dd88ff4f' AND role = 'user';
DELETE FROM public.profiles WHERE user_id = '8ab5f378-540a-4003-b47f-d7c9dd88ff4f';