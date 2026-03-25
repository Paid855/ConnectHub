const { PrismaClient } = require("./node_modules/@prisma/client");
const bcrypt = require("./node_modules/bcryptjs");

const p = new PrismaClient();

const USERS = [
  { name:"Amina Johnson", email:"amina@test.com", username:"amina_j", age:24, gender:"Woman", lookingFor:"Men", country:"Nigeria", bio:"Love music, dancing and good food. Looking for someone real.", interests:["Music","Dancing","Cooking","Travel"] },
  { name:"David Chen", email:"david@test.com", username:"david_c", age:27, gender:"Man", lookingFor:"Women", country:"USA", bio:"Software engineer by day, guitarist by night. Let's vibe!", interests:["Music","Gaming","Fitness","Tech"] },
  { name:"Sarah Williams", email:"sarah@test.com", username:"sarah_w", age:23, gender:"Woman", lookingFor:"Men", country:"UK", bio:"Bookworm, coffee addict, adventure seeker.", interests:["Reading","Coffee","Travel","Photography"] },
  { name:"James Okafor", email:"james@test.com", username:"james_o", age:28, gender:"Man", lookingFor:"Women", country:"Nigeria", bio:"Fitness coach. I believe love is the greatest adventure.", interests:["Fitness","Cooking","Football","Yoga"] },
  { name:"Maria Santos", email:"maria@test.com", username:"maria_s", age:25, gender:"Woman", lookingFor:"Men", country:"Brazil", bio:"Dancer, dreamer, dog lover. Swipe right if you love sunsets!", interests:["Dancing","Dogs","Beach","Fashion"] },
  { name:"Alex Thompson", email:"alex@test.com", username:"alex_t", age:26, gender:"Man", lookingFor:"Women", country:"Canada", bio:"Photographer and world traveler. Show me your favorite place!", interests:["Photography","Travel","Hiking","Coffee"] },
  { name:"Fatima Ahmed", email:"fatima@test.com", username:"fatima_a", age:22, gender:"Woman", lookingFor:"Men", country:"UAE", bio:"Medical student with a passion for art and poetry.", interests:["Art","Reading","Meditation","Writing"] },
  { name:"Michael Brown", email:"michael@test.com", username:"mike_b", age:29, gender:"Man", lookingFor:"Women", country:"USA", bio:"Chef, gym rat, movie buff. I'll cook you dinner!", interests:["Cooking","Fitness","Movies","Wine"] },
  { name:"Priya Sharma", email:"priya@test.com", username:"priya_s", age:24, gender:"Woman", lookingFor:"Men", country:"India", bio:"Engineer who loves to dance. Bollywood fan!", interests:["Dancing","Tech","Movies","Yoga"] },
  { name:"Emmanuel Mensah", email:"emma@test.com", username:"emma_m", age:26, gender:"Man", lookingFor:"Women", country:"Ghana", bio:"Teacher by profession, musician by passion. Let's create harmony!", interests:["Music","Writing","Football","Comedy"] },
  { name:"Lisa Park", email:"lisa@test.com", username:"lisa_p", age:23, gender:"Woman", lookingFor:"Men", country:"South Korea", bio:"K-drama addict, sushi lover, cat mom.", interests:["Movies","Cats","Fashion","Gaming"] },
  { name:"Omar Hassan", email:"omar@test.com", username:"omar_h", age:30, gender:"Man", lookingFor:"Women", country:"Egypt", bio:"Architect designing dreams. Looking for my co-pilot.", interests:["Art","Travel","Photography","Swimming"] },
  { name:"Grace Adeyemi", email:"grace@test.com", username:"grace_a", age:21, gender:"Woman", lookingFor:"Men", country:"Nigeria", bio:"Fashion design student. I see beauty in everything!", interests:["Fashion","Art","Music","Dancing"] },
  { name:"Ryan Miller", email:"ryan@test.com", username:"ryan_m", age:27, gender:"Man", lookingFor:"Women", country:"Australia", bio:"Surfer, dog dad, startup founder. Life is an adventure!", interests:["Swimming","Dogs","Tech","Beach"] },
  { name:"Zara Khan", email:"zara@test.com", username:"zara_k", age:25, gender:"Woman", lookingFor:"Men", country:"Pakistan", bio:"Foodie, bookworm, sunset chaser. Simple girl with big dreams.", interests:["Cooking","Reading","Travel","Coffee"] },
];

const POSTS = [
  "Just had the most amazing sunset view! Life is beautiful 🌅",
  "Who else loves rainy days with a good book? 📚☔",
  "Cooked jollof rice today and it was perfect! 🍚🔥",
  "Just finished a 10km run! New personal best 💪",
  "Looking for someone to explore new restaurants with! 🍕",
  "Music is the language of the soul 🎵❤️",
  "Happy Wednesday everyone! Sending good vibes ✨",
  "Beach day was exactly what I needed 🏖️",
  "Just adopted a puppy! Meet my new best friend 🐕",
  "Grateful for every new connection. Life is about people ❤️",
  "Coffee date anyone? ☕ I know the best spots!",
  "Gym progress is real! 6 months of consistency 🏋️",
  "Traveling solo taught me so much about myself ✈️",
  "Cooking dinner for friends tonight. What should I make?",
  "Friday vibes! What are your plans for the weekend? 🎉",
];

async function seed() {
  console.log("Seeding ConnectHub database...\n");
  
  const password = await bcrypt.hash("Test1234", 12);
  const createdUsers = [];

  for (const u of USERS) {
    try {
      const user = await p.user.create({
        data: {
          ...u,
          password,
          referralCode: "CH" + Math.random().toString(36).substring(2, 8).toUpperCase(),
          coins: Math.floor(Math.random() * 500) + 50,
          verified: Math.random() > 0.5,
          verificationStatus: Math.random() > 0.5 ? "approved" : null,
          tier: ["free","free","free","premium","free","gold","free","free","free","free"][Math.floor(Math.random()*10)],
          lastSeen: new Date(Date.now() - Math.floor(Math.random() * 3600000)),
        }
      });
      createdUsers.push(user);
      console.log("✓ Created user:", u.name, "|", u.email);
    } catch(e) {
      console.log("✗ Skipped:", u.name, "(already exists)");
    }
  }

  // Create posts
  let postCount = 0;
  for (const user of createdUsers) {
    const numPosts = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < numPosts; i++) {
      const content = POSTS[Math.floor(Math.random() * POSTS.length)];
      await p.post.create({ data: { userId: user.id, content } });
      postCount++;
    }
  }
  console.log("\n✓ Created", postCount, "posts");

  // Create some friendships
  let friendCount = 0;
  for (let i = 0; i < createdUsers.length - 1; i++) {
    if (Math.random() > 0.5) {
      const j = Math.floor(Math.random() * createdUsers.length);
      if (i !== j) {
        try {
          await p.friend.create({ data: { userId: createdUsers[i].id, friendId: createdUsers[j].id, status: Math.random() > 0.3 ? "accepted" : "pending" } });
          friendCount++;
        } catch {}
      }
    }
  }
  console.log("✓ Created", friendCount, "friendships");

  // Create some messages
  let msgCount = 0;
  for (let i = 0; i < 20; i++) {
    const sender = createdUsers[Math.floor(Math.random() * createdUsers.length)];
    const receiver = createdUsers[Math.floor(Math.random() * createdUsers.length)];
    if (sender.id !== receiver.id) {
      const msgs = ["Hey! How are you? 😊", "I love your profile!", "What are you up to?", "Nice to meet you!", "Your bio is so cool!", "We have so much in common!", "Would love to chat more ❤️", "How was your day?", "You seem really interesting!", "Let's grab coffee sometime!"];
      await p.message.create({ data: { senderId: sender.id, receiverId: receiver.id, content: msgs[Math.floor(Math.random() * msgs.length)] } });
      msgCount++;
    }
  }
  console.log("✓ Created", msgCount, "messages");

  // Create admin user
  try {
    const adminPwd = await bcrypt.hash("ConnectHub@2026", 12);
    await p.user.create({ data: { name: "Admin", email: "admin@connecthub.com", password: adminPwd, tier: "gold", verified: true, verificationStatus: "approved", coins: 999999, referralCode: "CHADMIN" } });
    console.log("\n✓ Admin created: admin@connecthub.com / ConnectHub@2026");
  } catch {
    console.log("\n✓ Admin already exists");
  }

  console.log("\n=== SEED COMPLETE ===");
  console.log("Test login: any user email above with password: Test1234");
  console.log("Admin login: admin@connecthub.com / ConnectHub@2026 / ConnectHub_Admin_2026_Secret");
}

seed().then(() => p.$disconnect()).catch(e => { console.error(e); p.$disconnect(); });
