// Seed the editable knowledge base (specialties, doctors, FAQ / policy items).
// Idempotent — upserts by slug, so re-running only fills gaps and leaves any
// admin edits to existing rows untouched except for the fields listed here.
//
//   npm run db:seed
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SPECIALTIES = [
  ["general-medicine", "General Medicine", "Everyday illness, check-ups, long-term conditions and anything you're not sure where to take.", "fever,cough,cold,flu,fatigue,tired,check up,checkup,general,blood test,unwell,infection,weight,diabetes,thyroid,cholesterol"],
  ["cardiology", "Cardiology", "The heart and circulation — rhythm problems, blood pressure, chest flutter, cholesterol, heart-failure care.", "heart,palpitation,palpitations,blood pressure,hypertension,cholesterol,irregular heartbeat,ecg,echo,cardiac"],
  ["orthopaedics", "Orthopaedics", "Bones, joints and soft tissue — knees, backs, shoulders, hips, fractures, sprains, arthritis and sports injuries.", "knee,joint,joints,back,back pain,shoulder,hip,bone,bones,fracture,sprain,arthritis,ligament,sports injury,neck pain,ankle,wrist,tendon"],
  ["dermatology", "Dermatology", "Skin, hair and nails — rashes, acne, eczema, psoriasis, mole checks and skin lesions.", "skin,rash,acne,eczema,psoriasis,mole,moles,itch,hives,hair loss,nails,dermatitis"],
  ["obstetrics-gynaecology", "Obstetrics & Gynaecology", "Pregnancy care, women's health, menstrual and fertility concerns, menopause and screening.", "pregnancy,pregnant,prenatal,antenatal,gynae,gynaecology,period,periods,menstrual,fertility,menopause,smear,pelvic"],
  ["paediatrics", "Paediatrics", "Care for newborns to age 16 — illness, development, vaccinations and general child health.", "child,children,kid,kids,infant,toddler,baby,paediatric,newborn,vaccination,immunisation,daughter,son,my child,my kid"],
  ["ent", "ENT (Ear, Nose & Throat)", "Ears, nose and throat — hearing, sinus problems, sore throats, tonsils, voice, dizziness and snoring.", "ear,ears,hearing,nose,sinus,throat,tonsil,tonsils,voice,snoring,vertigo,nosebleed,sore throat"],
  ["neurology", "Neurology", "The brain and nerves — headaches and migraine, dizziness, numbness or tingling, tremor and memory concerns.", "headache,headaches,migraine,dizziness,numbness,tingling,memory,tremor,nerve,neuralgia"],
  ["ophthalmology", "Ophthalmology", "Eyes and vision — blurred vision, dry or irritated eyes, floaters, cataract and routine eye health.", "eye,eyes,vision,blurred vision,glasses,cataract,dry eyes,floaters,eyesight"],
  ["gastroenterology", "Gastroenterology", "The digestive system — stomach and abdominal pain, reflux, bloating, bowel changes and liver concerns.", "stomach,abdominal,abdomen,digestion,acid reflux,heartburn,bloating,ibs,constipation,diarrhoea,liver,nausea"],
  ["imaging-radiology", "Diagnostic Imaging & Radiology", "MRI, CT, ultrasound and X-ray, usually reported the same day.", "scan,mri,ct,x-ray,xray,ultrasound,imaging,mammogram,radiology"],
  ["physiotherapy", "Physiotherapy & Rehabilitation", "Hands-on rehab for injury, pain and mobility — post-operative recovery, posture and strength.", "physio,physiotherapy,rehab,rehabilitation,mobility,posture,recovery,strain,stiffness"],
  ["general-surgery", "General Surgery", "Planned surgical care — hernias, gallstones, lumps and keyhole day-case procedures.", "hernia,gallbladder,gallstones,appendix,lump,lump removal,day surgery,keyhole surgery,cyst"],
  ["emergency-critical-care", "Emergency & Critical Care", "Walk-in emergency and trauma care, open 24 hours. For life-threatening problems call your local emergency number.", "urgent,minor injury,cut,stitches,minor burn,sprained,twisted"],
];

const DOCTORS = [
  ["marcus-ellingham", "Dr. Marcus Ellingham", "Consultant Cardiologist", "Cardiology", 27, "$180", "Interventional and structural heart disease, blood-pressure and rhythm management.", "English, French", "/doctors/ellingham.jpg", 1],
  ["camille-laurent", "Dr. Camille Laurent", "Consultant Physician", "General Medicine", 19, "$160", "Acute internal medicine, complex diagnostics and long-term condition reviews.", "English, French", "/doctors/laurent.jpg", 2],
  ["ada-okafor", "Dr. Ada Okafor", "Consultant Obstetrician & Gynaecologist", "Obstetrics & Gynaecology", 21, "$170", "High-risk pregnancy, fetal medicine and general gynaecology.", "English", "/doctors/okafor.jpg", 3],
  ["rohan-nasser", "Dr. Rohan Nasser", "Consultant Radiologist", "Diagnostic Imaging & Radiology", 14, "$140", "Cross-sectional and interventional imaging; same-day reporting.", "English, Arabic", "/doctors/nasser.jpg", 4],
  ["julian-hale", "Dr. Julian Hale", "Consultant Anaesthetist", "General Surgery", 16, "$150", "Theatre anaesthesia and pain medicine for day-case and complex surgery.", "English", "/doctors/hale.jpg", 5],
  ["priya-anand", "Dr. Priya Anand", "Consultant Orthopaedic Surgeon", "Orthopaedics", 18, "$175", "Knee and shoulder surgery, sports injuries and joint preservation.", "English, Hindi", null, 6],
  ["thomas-reyes", "Dr. Thomas Reyes", "Consultant Dermatologist", "Dermatology", 13, "$155", "General dermatology, skin-cancer surveillance and minor skin surgery.", "English, Spanish", null, 7],
  ["sofia-berg", "Dr. Sofia Berg", "Consultant Paediatrician", "Paediatrics", 15, "$150", "General paediatrics, childhood asthma and development reviews.", "English, Swedish", null, 8],
  ["hassan-farouk", "Dr. Hassan Farouk", "Consultant ENT Surgeon", "ENT (Ear, Nose & Throat)", 17, "$160", "Sinus and nasal surgery, hearing and balance, paediatric ENT.", "English, Arabic", null, 9],
  ["grace-liu", "Dr. Grace Liu", "General Practitioner", "General Medicine", 11, "$120", "Everyday illness, health checks, travel health and referrals.", "English, Mandarin", null, 10],
  ["daniel-okoro", "Daniel Okoro", "Lead Physiotherapist", "Physiotherapy & Rehabilitation", 12, "$90", "Musculoskeletal rehab, post-operative recovery and return-to-sport programmes.", "English", null, 11],
];

const KNOWLEDGE = [
  ["kb-hours", "hours", "Opening hours", "Outpatient clinics: Monday to Friday 8:00–20:00. Weekend clinics: Saturday 9:00–15:00. Visiting hours: every day 11:00–20:00. Emergency & Trauma is open 24 hours, every day.", 1],
  ["kb-pharmacy", "hours", "Pharmacy hours", "The on-site pharmacy is open Monday to Saturday, 8:00–20:00.", 2],
  ["kb-location", "location", "Getting here & parking", "We're at 8 Meridian Quarter, City Centre. Underground visitor parking is on site (first 30 minutes free). The Meridian Quarter tram stop is a 3-minute walk.", 1],
  ["kb-contact", "contact", "Phone & email", "Reception: +1 (555) 200-4000. Emergency & Trauma: +1 (555) 200-4111. Email: reception@anaverse.hospital.", 1],
  ["kb-referrals", "policy", "Booking & referrals", "Most outpatient clinics can be booked directly. A few specialties prefer a GP referral letter — reception will let you know when you book.", 1],
  ["kb-cancellations", "policy", "Cancellations & rescheduling", "Please give at least 24 hours' notice to change or cancel an appointment so we can offer the slot to someone else. Late cancellations may incur a small fee.", 2],
  ["kb-what-to-bring", "policy", "What to bring", "Photo ID, any referral letter, a list of your current medicines, and previous scans or test results if you have them.", 3],
  ["kb-insurance", "insurance", "Insurance & payment", "We accept major private health insurers and self-pay. Please confirm cover and any excess with your insurer before your visit. Card and contactless payment are accepted on site.", 1],
  ["kb-children", "faq", "Do you treat children?", "Yes — our Paediatrics team sees newborns up to age 16. A parent or guardian must attend the appointment.", 1],
  ["kb-video", "faq", "Do you offer video consultations?", "Several clinics offer video appointments for follow-ups and non-physical reviews. Ask reception when you book.", 2],
  ["kb-access", "faq", "Is the hospital wheelchair accessible?", "Yes — step-free access throughout, accessible parking bays and lifts to every floor.", 3],
  ["kb-wait", "faq", "How soon can I be seen?", "Many clinics have appointments within a few days, and urgent slots are held each day. Emergency & Trauma is walk-in, 24/7.", 4],
  ["kb-imaging", "service", "Diagnostic imaging", "On-site 1.5T MRI, 128-slice CT, ultrasound and X-ray — usually reported the same day.", 1],
  ["kb-health-assessment", "service", "Health assessments", "Half-day health assessments include a consultant review, full bloods and an ECG, with a written report within 48 hours.", 2],
];

async function main() {
  for (const [slug, name, description, keywords] of SPECIALTIES) {
    await prisma.specialty.upsert({
      where: { slug },
      update: { name, description, keywords },
      create: { slug, name, description, keywords, sortOrder: SPECIALTIES.findIndex((s) => s[0] === slug) },
    });
  }

  for (const [slug, name, title, specialty, yrs, fee, bio, languages, photo, sortOrder] of DOCTORS) {
    await prisma.doctor.upsert({
      where: { slug },
      update: { name, title, specialty, yearsExperience: yrs, consultationFee: fee, bio, languages, photo, sortOrder },
      create: { slug, name, title, specialty, yearsExperience: yrs, consultationFee: fee, bio, languages, photo, sortOrder },
    });
  }

  for (const [slug, category, title, content, sortOrder] of KNOWLEDGE) {
    await prisma.knowledgeItem.upsert({
      where: { slug },
      update: { category, title, content, sortOrder },
      create: { slug, category, title, content, sortOrder },
    });
  }

  const counts = {
    specialties: await prisma.specialty.count(),
    doctors: await prisma.doctor.count(),
    knowledge: await prisma.knowledgeItem.count(),
  };
  console.log("Seeded knowledge base:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
