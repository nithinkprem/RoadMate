const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 1. Helper to manually parse .env.local file variables (avoiding external dependencies)
const parseEnvLocal = () => {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.warn('.env.local file not found. Falling back to environment variables.');
    return {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
    };
  }

  const fileContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  fileContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      const val = valueParts.join('=').trim();
      // Remove enclosing quotes if any
      envVars[key.trim()] = val.replace(/^["']|["']$/g, '');
    }
  });

  return {
    url: envVars['NEXT_PUBLIC_SUPABASE_URL'] || process.env.NEXT_PUBLIC_SUPABASE_URL,
    key:
      envVars['SUPABASE_SERVICE_ROLE_KEY'] ||
      envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
};

const { url: supabaseUrl, key: supabaseKey } = parseEnvLocal();

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
  console.error(
    'ERROR: Supabase URL or Anon/Service key is missing or unconfigured. Seeding aborted.'
  );
  console.error(
    'Please configure your .env.local file with real database keys before running the seed script.'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Initial Calicut Shop Data
const CALICUT_SEED_SHOPS = [
  {
    name: 'Calicut Tyre Hub & Puncture Clinic',
    owner_name: 'Rasheed P. K.',
    phone: '9876543210',
    category: 'tyre',
    latitude: 11.2588,
    longitude: 75.7804,
    address: 'Mavoor Road, Near KSRTC Stand, Calicut',
    hours_json: {
      regular: {
        monday: [{ open: '08:00', close: '22:00' }],
        tuesday: [{ open: '08:00', close: '22:00' }],
        wednesday: [{ open: '08:00', close: '22:00' }],
        thursday: [{ open: '08:00', close: '22:00' }],
        friday: [{ open: '08:00', close: '22:00' }],
        saturday: [{ open: '08:00', close: '22:00' }],
        sunday: [{ open: '09:00', close: '18:00' }],
      },
    },
    price_range: '₹150-300',
    supports_upi: true,
    mobile_mechanic: true,
    night_service: false,
    languages: ['Malayalam', 'English'],
    source: 'manual',
    verified: true,
  },
  {
    name: 'Malabar Battery & Electrical Works',
    owner_name: 'Siddique Ali',
    phone: '9876543211',
    category: 'battery',
    latitude: 11.2612,
    longitude: 75.7845,
    address: 'Link Road, Kozhikode',
    hours_json: {
      regular: {
        monday: [{ open: '00:00', close: '23:59' }],
        tuesday: [{ open: '00:00', close: '23:59' }],
        wednesday: [{ open: '00:00', close: '23:59' }],
        thursday: [{ open: '00:00', close: '23:59' }],
        friday: [{ open: '00:00', close: '23:59' }],
        saturday: [{ open: '00:00', close: '23:59' }],
        sunday: [{ open: '00:00', close: '23:59' }],
      },
    },
    price_range: '₹200-500',
    supports_upi: true,
    mobile_mechanic: true,
    night_service: true,
    languages: ['Malayalam', 'English', 'Hindi'],
    source: 'manual',
    verified: true,
  },
  {
    name: 'Royal Auto Garage (Two-Wheeler Spl)',
    owner_name: 'Vikraman P.',
    phone: '9876543212',
    category: 'mechanic',
    latitude: 11.2545,
    longitude: 75.7721,
    address: 'Palayam, Calicut',
    hours_json: {
      regular: {
        monday: [{ open: '09:00', close: '19:00' }],
        tuesday: [{ open: '09:00', close: '19:00' }],
        wednesday: [{ open: '09:00', close: '19:00' }],
        thursday: [{ open: '09:00', close: '19:00' }],
        friday: [{ open: '09:00', close: '19:00' }],
        saturday: [{ open: '09:00', close: '19:00' }],
        sunday: [],
      },
    },
    price_range: '₹250-700',
    supports_upi: true,
    mobile_mechanic: false,
    night_service: false,
    languages: ['Malayalam'],
    source: 'manual',
    verified: true,
  },
  {
    name: 'Kozhikode 24/7 Heavy Towing',
    owner_name: 'Biju Calicut',
    phone: '9876543213',
    category: 'towing',
    latitude: 11.2721,
    longitude: 75.7951,
    address: 'Bypass Road, Calicut',
    hours_json: {
      regular: {
        monday: [{ open: '00:00', close: '23:59' }],
        tuesday: [{ open: '00:00', close: '23:59' }],
        wednesday: [{ open: '00:00', close: '23:59' }],
        thursday: [{ open: '00:00', close: '23:59' }],
        friday: [{ open: '00:00', close: '23:59' }],
        saturday: [{ open: '00:00', close: '23:59' }],
        sunday: [{ open: '00:00', close: '23:59' }],
      },
    },
    price_range: '₹1200-3000',
    supports_upi: true,
    mobile_mechanic: false,
    night_service: true,
    languages: ['Malayalam', 'English'],
    source: 'manual',
    verified: true,
  },
];

const seedDatabase = async () => {
  console.log(`Initializing idempotent seeding on Supabase database at: ${supabaseUrl}...`);

  for (const shop of CALICUT_SEED_SHOPS) {
    try {
      // Check if listing already exists with identical name and phone
      const { data: existing, error: queryError } = await supabase
        .from('shops')
        .select('id')
        .eq('name', shop.name)
        .eq('phone', shop.phone)
        .maybeSingle();

      if (queryError) {
        console.error(`Error querying check for ${shop.name}:`, queryError.message);
        continue;
      }

      if (existing) {
        console.log(`Shop "${shop.name}" already exists (id: ${existing.id}). Updating details...`);
        const { error: updateError } = await supabase
          .from('shops')
          .update(shop)
          .eq('id', existing.id);

        if (updateError) {
          console.error(`Error updating "${shop.name}":`, updateError.message);
        } else {
          console.log(`Successfully updated "${shop.name}".`);
        }
      } else {
        console.log(`Inserting new shop: "${shop.name}"...`);
        const { error: insertError } = await supabase.from('shops').insert(shop);

        if (insertError) {
          console.error(`Error inserting "${shop.name}":`, insertError.message);
        } else {
          console.log(`Successfully inserted "${shop.name}".`);
        }
      }
    } catch (err) {
      console.error(`Unexpected failure seeding shop "${shop.name}":`, err);
    }
  }

  console.log('Database seeding process completed.');
};

seedDatabase();
