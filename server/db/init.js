import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://vibeesuser:Tb8l71gAt5SRdBSb@cluster0.ure9w.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri, {
  maxPoolSize: 50,
  wtimeoutMS: 2500,
  useNewUrlParser: true
});

async function initializeDatabase(retries = 5) {
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('vibees');

    // Create events collection if it doesn't exist
    if (!(await db.listCollections({ name: 'events' }).hasNext())) {
      await db.createCollection('events');
      console.log('Events collection created');

      // Create indexes
      await db.collection('events').createIndexes([
        { key: { title: 1 } },
        { key: { startDate: 1 } },
        { key: { status: 1 } },
        { key: { type: 1 } }
      ]);
      console.log('Indexes created for events collection');
    }

    // Insert sample data if collection is empty
    const count = await db.collection('events').countDocuments();
    if (count === 0) {
      const sampleEvents = [
        {
          title: 'Tech Innovation Summit 2025',
          description: 'Join industry leaders for a day of cutting-edge technology discussions and networking opportunities.',
          startDate: new Date('2025-04-15T09:00:00Z'),
          endDate: new Date('2025-04-15T17:00:00Z'),
          imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1000',
          type: 'hybrid',
          status: 'upcoming',
          capacity: 500,
          registeredCount: 127,
          earlyBirdDeadline: new Date('2025-03-15T23:59:59Z')
        },
        {
          title: 'Digital Marketing Masterclass',
          description: 'Learn advanced digital marketing strategies from experienced professionals.',
          startDate: new Date('2025-05-20T10:00:00Z'),
          endDate: new Date('2025-05-20T16:00:00Z'),
          imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=1000',
          type: 'online',
          status: 'upcoming',
          capacity: 200,
          registeredCount: 45
        },
        {
          title: 'Startup Networking Event',
          description: 'Connect with fellow entrepreneurs and investors in this exclusive networking event.',
          startDate: new Date('2025-06-10T18:00:00Z'),
          endDate: new Date('2025-06-10T21:00:00Z'),
          imageUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=1000',
          type: 'physical',
          status: 'upcoming',
          capacity: 150,
          registeredCount: 89
        }
      ];

      await db.collection('events').insertMany(sampleEvents);
      console.log('Sample events inserted');
    }

    console.log('Database initialization completed');
  } catch (error) {
    console.error('Error initializing database:', error);
    if (retries > 0) {
      console.log(`Retrying... ${retries} attempts remaining`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return initializeDatabase(retries - 1);
    }
    throw error;
  } finally {
    await client.close();
  }
}

initializeDatabase().catch(console.error);