const MemoryStore = require('../lib/sessionStore/memoryStore.js');

describe('MemoryStore', () => {
  let store;

  beforeEach(() => {
    store = new MemoryStore();
  });

  test('should store and retrieve a session', async () => {
    const session = {
      sid: '123',
      data: { user: 'testUser' },
      expires: new Date(Date.now() + 10000), // expires in 10 seconds
    };

    await store.set(session);

    const retrievedSession = await store.get('123');
    expect(retrievedSession).not.toBeNull();
    expect(retrievedSession.sid).toBe(session.sid);
    expect(retrievedSession.data).toEqual(session.data);
    expect(new Date(retrievedSession.expires)).toEqual(session.expires);
  });

  test('should return null for a non-existent session', async () => {
    const session = await store.get('nonexistent');
    expect(session).toBeNull();
  });

  test('should store and destroy a session', async () => {
    const session = {
      sid: '123',
      data: { user: 'testUser' },
      expires: new Date(Date.now() + 10000),
    };

    await store.set(session);
    await store.destroy('123');

    const retrievedSession = await store.get('123');
    expect(retrievedSession).toBeNull();
  });

  test('should store a session with a modified date', async () => {
    const session = {
      sid: '123',
      data: { user: 'testUser' },
      expires: new Date(Date.now() + 10000),
      modified: new Date(Date.now() - 10000), // modified 10 seconds ago
    };

    await store.set(session);

    const retrievedSession = await store.get('123');
    expect(retrievedSession).not.toBeNull();
    expect(retrievedSession.sid).toBe(session.sid);
    expect(retrievedSession.data).toEqual(session.data);
    expect(new Date(retrievedSession.expires)).toEqual(session.expires);
    expect(new Date(store.memoryStore['123'].modified)).toEqual(session.modified);
  });
});
