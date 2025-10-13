import express from 'express';
import cors from 'cors';
import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  maxPoolSize: 50,
  connectTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});

let isConnected = false;
let db;

async function connectDB() {
  try {
    if (!isConnected) {
      await client.connect();
      db = client.db('vibees');
      isConnected = true;
      console.log('Connected to MongoDB');
      
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
          },
          {
            title: 'AI & Machine Learning Conference',
            description: 'Explore the latest advancements in AI and machine learning with leading researchers and practitioners.',
            startDate: new Date('2025-07-05T08:00:00Z'),
            endDate: new Date('2025-07-07T18:00:00Z'),
            imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=1000',
            type: 'hybrid',
            status: 'upcoming',
            capacity: 800,
            registeredCount: 342,
            earlyBirdDeadline: new Date('2025-06-01T23:59:59Z')
          },
          {
            title: 'Web Development Workshop Series',
            description: 'A comprehensive series of workshops covering modern web development technologies and best practices.',
            startDate: new Date('2025-08-15T14:00:00Z'),
            endDate: new Date('2025-08-17T17:00:00Z'),
            imageUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=1000',
            type: 'online',
            status: 'upcoming',
            capacity: 300,
            registeredCount: 158
          },
          {
            title: 'Sustainable Technology Summit',
            description: 'Discover how technology is driving sustainability and environmental conservation efforts worldwide.',
            startDate: new Date('2025-09-22T09:00:00Z'),
            endDate: new Date('2025-09-23T17:00:00Z'),
            imageUrl: 'https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?auto=format&fit=crop&q=80&w=1000',
            type: 'hybrid',
            status: 'upcoming',
            capacity: 600,
            registeredCount: 275,
            earlyBirdDeadline: new Date('2025-08-15T23:59:59Z')
          },
          {
            title: 'Cybersecurity Forum 2025',
            description: 'Essential cybersecurity insights and hands-on workshops for IT professionals and security experts.',
            startDate: new Date('2025-10-10T08:30:00Z'),
            endDate: new Date('2025-10-11T16:30:00Z'),
            imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1000',
            type: 'physical',
            status: 'upcoming',
            capacity: 400,
            registeredCount: 186
          },
          {
            title: 'Design Systems Workshop',
            description: 'Learn to create and maintain scalable design systems for modern digital products.',
            startDate: new Date('2025-11-05T10:00:00Z'),
            endDate: new Date('2025-11-05T17:00:00Z'),
            imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1000',
            type: 'online',
            status: 'upcoming',
            capacity: 250,
            registeredCount: 98
          }
        ];

        await db.collection('events').insertMany(sampleEvents);
        console.log('Sample events inserted');
      }
    }
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    isConnected = false;
    throw error;
  }
}

async function getEventsWithRetry(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const db = await connectDB();
      const events = await db.collection('events').find().toArray();
      return events;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      isConnected = false;
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

app.get('/api/events', async (req, res) => {
  try {
    const events = await getEventsWithRetry();
    
    if (!events || !events.length) {
      return res.status(404).json({ message: 'No events found' });
    }
    
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const gracefulShutdown = async () => {
  try {
    if (isConnected) {
      await client.close();
      console.log('MongoDB connection closed');
    }
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${port}`);
});