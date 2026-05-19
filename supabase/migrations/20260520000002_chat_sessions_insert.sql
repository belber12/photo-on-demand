-- Allow anonymous clients to insert chat sessions (required for frontend useChat.js)
CREATE POLICY "anon_insert_chat_sessions"
  ON public.chat_sessions
  FOR INSERT
  TO anon
  WITH CHECK (true);
