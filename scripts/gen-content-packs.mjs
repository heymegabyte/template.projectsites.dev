#!/usr/bin/env node
// Generates examples/_content.<vertical>.json — deterministic per-vertical DEFAULT
// section content. Used by projectsites container-server.mjs (applyVerticalContentPack)
// so a generated site is never a self-hiding stub when AI research is thin.
// Name-agnostic copy (no {TOKEN} inside values), Flesch >= 60, no slop words.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'examples');

// 6 relevant per-vertical background photos for the feature bento tiles (real
// images.unsplash.com URLs). Refresh with fetch-vertical-images.mjs-style query
// (per_page=6). Committed so the generator stays reproducible + self-contained.
const FEATURE_IMG = JSON.parse(
  fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'vertical-feature-images.json'), 'utf8'),
);

// 6 people/results-focused per-vertical photos for the Home gallery (masonry +
// lightbox), distinct from the environment-focused feature/bento set. {src,alt}.
const GALLERY_IMG = JSON.parse(
  fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'vertical-gallery-images.json'), 'utf8'),
);

// Per-vertical spec. Arrays are positional; the mapper below flattens them to tokens.
const V = {
  medical: {
    hero: ['Trusted primary care for every age', 'From annual physicals to same-day sick visits, we care for your whole family with warmth and honesty. Whether you need a routine checkup, help managing a chronic condition, a vaccine, or a same-day visit when you are feeling unwell, our board-certified team treats you like a person, not a chart. New patients are always welcome.', 'Book a visit', 'See services'],
    badges: ['Most insurance accepted', 'Same-day sick visits', 'Care for the whole family'],
    features: [['Same-day sick visits', 'Feeling unwell? Call in the morning and we will do our best to see you the same day.'], ['Board-certified physicians', 'Experienced family doctors who listen closely and treat the whole person, not just a symptom.'], ['Most insurance accepted', 'We take the major plans and check your benefits up front, so there are no surprises.'], ['On-site labs & diagnostics', 'Common blood work and tests happen right here, so you get answers faster.'], ['Telehealth visits', 'Handle minor concerns and follow-ups from home with a secure video visit.'], ['Care for every age', 'One trusted practice for kids, parents, and grandparents at every stage of life.']],
    servicesHead: ['Complete care for the whole family', 'Preventive checkups and primary care for every age, all in one welcoming practice.'],
    services: [['Annual Physicals & Wellness Exams', 'A thorough yearly checkup that reviews your health head to toe. We track key numbers, answer your questions, and help you stay well in plain language.'], ['Preventive Care & Screenings', 'Age-appropriate screenings and simple lab tests that catch issues early, when they are easiest to treat. We tailor the plan to your health and history.'], ['Chronic Disease Management', 'Steady, personal care for diabetes, blood pressure, and cholesterol. We adjust your plan, track your progress, and keep you feeling your best.'], ['Pediatric & Adolescent Care', 'Well-child visits, growth checks, and sick care for kids and teens. We build trust early so your children feel at ease in the office.'], ['Immunizations & Vaccines', 'Routine and seasonal vaccines for the whole family, from childhood shots to the annual flu vaccine, kept current and convenient.'], ['Women’s Health & Wellness', 'Well-woman visits, routine screenings, and honest guidance through every stage of life, delivered with comfort and respect.']],
    servicesCta: ['Not sure what you need?', 'Book a wellness visit and we will build a simple, honest care plan together.'],
    statsHead: 'Trusted by neighbors for years',
    stats: [['25+ Years', 'caring for local families'], ['15k+ Patients', 'and still growing'], ['4.9 Stars', 'across patient reviews'], ['Same Day', 'sick appointments']],
    process: [['Book', 'Reserve online or call, and tell us what is going on.'], ['Meet', 'We listen, examine you carefully, and explain what we find.'], ['Plan', 'You get clear options and next steps with no pressure.'], ['Care', 'We treat you comfortably and help you stay healthy for good.']],
    faqHead: ['Questions patients ask', 'Straight answers about visits, insurance, and care.'],
    faqs: [['Do you accept my insurance?', 'We accept most major plans and file the claims for you. Call us with your card and we will confirm your coverage.'], ['Can I be seen the same day when I am sick?', 'Very often, yes. Call us early in the day and we will do everything we can to fit you in for an urgent visit.'], ['Do you see children?', 'Yes. We care for every age, so the whole family can share one trusted practice.'], ['Can I become a new patient?', 'Absolutely. We are welcoming new patients of all ages. Reach out and we will make your first visit simple and easy.']],
    cta: ['Ready for care you can trust?', 'New patients welcome. Book a visit today and feel the difference honest, personal care makes.', 'Book your visit'],
    about: ['Care that treats you like family', 'Our team blends modern medicine with an old-fashioned bedside manner. We take the time to listen, explain your options in plain language, and make every visit comfortable and unhurried — because good care starts with actually being heard. From your first phone call to your follow-up, you work with people who know your name and genuinely care how you are doing.', 'Our promise to you', 'Honest guidance, careful attention, and steady care you can rely on. That is the standard we hold on every single visit.'],
    meta: ['A welcoming family medicine practice offering annual physicals, preventive care, chronic-condition management, and same-day sick visits.', 'Explore our services: annual physicals, preventive screenings, chronic disease management, pediatric care, immunizations, and women’s health.'],
  },
  dental: {
    hero: ['Gentle dental care for your whole family', 'From routine cleanings to same-day emergencies, we keep every smile healthy and comfortable. New patients are always welcome.', 'Book a visit', 'See services'],
    badges: ['Most insurance accepted', 'Same-day emergency visits', 'Gentle, judgment-free care'],
    features: [['Comfort-first visits', 'Numbing, sedation options, and a calm team make every appointment easy.'], ['Same-day emergencies', 'Call in pain and we will get you seen the same day whenever we can.'], ['Clear, upfront pricing', 'You see the cost and your insurance estimate before we begin.'], ['Family-friendly', 'One trusted office for kids, parents, and grandparents alike.'], ['Modern, gentle tech', 'Digital X-rays and quiet tools mean less waiting and less discomfort.'], ['Easy scheduling', 'Book online, get reminders, and reschedule in a couple of taps.']],
    servicesHead: ['Complete care under one roof', 'Preventive, restorative, and cosmetic dentistry for every stage of life.'],
    services: [['Cleanings & Exams', 'Thorough cleanings and check-ups that catch small problems early. We explain everything we see in plain language.'], ['Fillings & Crowns', 'Tooth-colored fillings and durable crowns that restore comfort and blend right in. Most are done in one or two visits.'], ['Teeth Whitening', 'Safe, professional whitening that lifts years of stains. Take-home trays keep your smile bright.'], ['Invisalign & Aligners', 'Straighten your teeth with clear, removable aligners. We map the full plan before you start.'], ['Dental Implants', 'Permanent, natural-looking replacements for missing teeth. They restore both chewing and confidence.'], ['Emergency Care', 'Chipped, cracked, or aching? We reserve daily slots for urgent visits and fast relief.']],
    servicesCta: ['Not sure what you need?', 'Book a check-up and we will build a simple, honest plan together.'],
    statsHead: 'Trusted by neighbors for years',
    stats: [['25+ Years', 'caring for local families'], ['15k+ Patients', 'and still growing'], ['4.9 Stars', 'across patient reviews'], ['Same Day', 'emergency appointments']],
    process: [['Book', 'Reserve online or call, and tell us what is bothering you.'], ['Meet', 'We listen, examine gently, and explain what we find.'], ['Plan', 'You get clear options and pricing with no pressure.'], ['Care', 'We treat comfortably and keep your smile healthy for good.']],
    faqHead: ['Questions patients ask', 'Straight answers about visits, insurance, and comfort.'],
    faqs: [['Do you accept my insurance?', 'We accept most major plans and file the claims for you. Call us with your card and we will confirm your coverage.'], ['I am nervous about the dentist. Can you help?', 'Absolutely. We offer numbing and sedation options and move at your pace, with no judgment about time away from care.'], ['Do you see children?', 'Yes. We care for every age, so the whole family can share one trusted office.'], ['What if I have a dental emergency?', 'Call us right away. We hold same-day slots for pain, chips, and swelling and will get you seen fast.']],
    cta: ['Ready for a healthier smile?', 'New patients welcome. Book a visit today and feel the difference gentle care makes.', 'Book your visit'],
    about: ['Care that treats you like family', 'Our team blends modern dentistry with an old-fashioned bedside manner. We take time to listen, explain, and make every visit comfortable.', 'Our promise to you', 'Honest recommendations, gentle hands, and a healthy smile that lasts. That is the standard we hold on every single visit.'],
    meta: ['A friendly family dental practice offering gentle cleanings, crowns, whitening, implants, and same-day emergency care.', 'Explore our dental services: cleanings, fillings, crowns, whitening, Invisalign, implants, and emergency care.'],
  },
  wellness: {
    hero: ['Move, breathe, and feel restored', 'A welcoming studio for every body and every level. Find strength, calm, and a community that cheers you on.', 'Start your first class', 'View schedule'],
    badges: ['All levels welcome', 'First class on us', 'Small, personal classes'],
    features: [['Every body welcome', 'Beginners and lifelong practitioners share the same warm, judgment-free space.'], ['Expert instructors', 'Certified teachers guide you safely and adjust for your goals.'], ['Flexible schedule', 'Morning, midday, and evening classes fit around real life.'], ['Calm, clean space', 'A quiet, spotless studio designed to help you unwind the moment you arrive.'], ['Community first', 'Make friends, stay accountable, and celebrate small wins together.'], ['Easy booking', 'Reserve your mat online and get a friendly reminder before class.']],
    servicesHead: ['Classes for strength and calm', 'From gentle stretch to a good sweat, there is a class for how you feel today.'],
    services: [['Vinyasa Flow', 'Link breath and movement in a flowing, energizing practice. Great for building strength and focus.'], ['Gentle & Restorative', 'Slow, supported poses that release tension and calm the nervous system. Perfect after a long week.'], ['Power Yoga', 'A stronger, faster class that builds heat and stamina. Modifications keep it accessible.'], ['Meditation & Breathwork', 'Simple, guided practices to quiet the mind and steady your breath. No experience needed.'], ['Pilates & Core', 'Low-impact work that builds a strong, stable center and better posture.'], ['Private Sessions', 'One-on-one guidance tailored to your body, goals, and pace.']],
    servicesCta: ['New to the practice?', 'Try an intro class and we will help you find the right fit.'],
    statsHead: 'A community that keeps growing',
    stats: [['10+ Years', 'in the neighborhood'], ['30+ Classes', 'every week'], ['4.9 Stars', 'from our members'], ['All Levels', 'truly welcome']],
    process: [['Reserve', 'Book your spot online in under a minute.'], ['Arrive', 'Come as you are; we have mats and props ready.'], ['Practice', 'Move at your pace with caring, expert guidance.'], ['Glow', 'Leave lighter, stronger, and ready for your week.']],
    faqHead: ['Before your first class', 'Everything a first-timer wants to know.'],
    faqs: [['I have never done this before. Is that okay?', 'Completely. Our classes welcome beginners, and instructors offer easy options for every pose.'], ['What should I bring?', 'Just comfortable clothes and water. We provide mats and props if you need them.'], ['How early should I arrive?', 'Come about ten minutes early to settle in and meet your instructor.'], ['Do you offer memberships?', 'Yes, along with class packs and drop-ins, so you can practice on your own terms.']],
    cta: ['Your first class is on us', 'Roll out a mat, take a breath, and see how good it feels to slow down.', 'Claim your class'],
    about: ['A studio built for real people', 'We created a calm, welcoming space where anyone can build strength and find balance. No cliques, no pressure, just good movement and good company.', 'Why we teach', 'We believe a steady practice changes lives, one breath at a time. Our mission is to make that practice feel like home.'],
    meta: ['A welcoming yoga and wellness studio with classes for every level: flow, restorative, power, meditation, and Pilates.', 'Browse our classes: vinyasa flow, restorative, power yoga, meditation, Pilates, and private sessions for all levels.'],
  },
  fitness: {
    hero: ['Get stronger, one session at a time', 'A serious strength gym that still feels welcoming. Barbells, coaching, and classes for every level, with people who help you show up and get results.', 'Start training', 'View memberships'],
    badges: ['All levels welcome', 'First session free', 'Real coaching, not just a room'],
    features: [['Every level welcome', 'First-timers and seasoned lifters train side by side, and no one is judged for where they start.'], ['Coaching that sticks', 'Certified coaches teach real technique and keep you safe as you add weight.'], ['Strength you can measure', 'Track your lifts and watch the numbers climb, week after week.'], ['Real equipment', 'Barbells, racks, plates, and platforms built for lifting, not just cardio machines.'], ['Train on your schedule', 'Early mornings, lunch breaks, and evenings, plus a class list that fits real life.'], ['Easy sign-up', 'Book your first session online in a minute and lock in a plan that fits.']],
    servicesHead: ['Training built around your goals', 'From your first barbell to a competition platform, there is a program for where you are now.'],
    services: [['Strength & Barbell Training', 'Learn the squat, bench, and deadlift with coaching that builds a strong, confident base. We scale every lift to your level and add weight when you are ready.'], ['Personal Training', 'One-on-one sessions built around your goals, your schedule, and your body. Your coach writes the plan and holds you to it, session after session.'], ['Small-Group Classes', 'Coached, energetic classes that mix strength and conditioning in under an hour. Small groups mean real attention and a crew that pushes you.'], ['Powerlifting & Olympic Lifting', 'Chase a bigger total or clean up your technique with focused platform coaching. Great for first-time competitors and seasoned lifters alike.'], ['Mobility & Recovery', 'Move better and stay healthy with guided warm-ups, mobility work, and recovery sessions that keep you training pain-free for the long haul.'], ['Membership', 'Full gym access, open-gym hours, and a community that shows up. Simple month-to-month plans with no long contracts and no games.']],
    servicesCta: ['Not sure where to start?', 'Book a free session and we will map a plan that matches your goals.'],
    statsHead: 'A gym members stick with',
    stats: [['10+ Years', 'coaching in the community'], ['500+ Members', 'training strong'], ['4.9 Stars', 'from our members'], ['All Levels', 'genuinely welcome']],
    process: [['Book', 'Reserve your free first session online in under a minute.'], ['Assess', 'A coach learns your goals and checks your movement, no pressure.'], ['Train', 'You follow a clear plan and add weight as you get stronger.'], ['Progress', 'You hit new numbers, feel better, and keep the momentum going.']],
    faqHead: ['Before your first session', 'Everything a first-timer wants to know.'],
    faqs: [['I am out of shape. Is this gym for me?', 'Completely. Most members start exactly where you are, and our coaches scale every workout to your level. You will never be thrown into the deep end.'], ['Do I need experience with weights?', 'Not at all. We teach the lifts from the ground up, with hands-on coaching, so you build good technique and real confidence from day one.'], ['What should I bring?', 'Just training clothes, athletic shoes, and a water bottle. We provide all the equipment you need for your first session and beyond.'], ['Do you offer memberships and drop-ins?', 'Yes. We keep it flexible with month-to-month memberships, class packs, and drop-ins, so you can train on your own terms.']],
    cta: ['Your first session is on us', 'Come lift, meet the coaches, and feel what real training does. No pressure, no commitment.', 'Claim your session'],
    about: ['A strength gym built for everyone', 'We built a gym where beginners and lifelong lifters train under the same roof, coached by people who care about your results. No egos, no intimidation, just hard work and a crew that has your back.', 'Why we coach', 'We believe getting strong changes how you feel about everything else. Our mission is to make that strength reachable for anyone willing to show up and put in the work.'],
    meta: ['A welcoming strength and conditioning gym with coaching, barbell training, small-group classes, and personal training for every level.', 'Explore our training: strength and barbell, personal training, small-group classes, powerlifting, mobility, and membership.'],
  },
  legal: {
    hero: ['Trusted counsel when it matters most', 'Clear advice, steady guidance, and a team that fights for your outcome. Whether you are facing a difficult divorce, planning your estate, recovering from an injury, or protecting your business, we handle the details and the hard conversations so you can move forward with confidence and peace of mind.', 'Request a consultation', 'Our practice areas'],
    badges: ['Free initial consultation', 'Decades of experience', 'Straight, honest advice'],
    features: [['Clear communication', 'You get plain-language updates and a lawyer who returns your calls.'], ['Proven results', 'Years of favorable outcomes for clients in situations like yours.'], ['Personal attention', 'Your case is handled by a senior attorney, not passed down the hall.'], ['Confidential & discreet', 'Your matter stays private, handled with care at every step.'], ['Fair, transparent fees', 'You know the structure up front, with no surprise bills.'], ['Responsive team', 'Questions answered quickly, because timing often matters.']],
    servicesHead: ['Areas we practice', 'Focused, experienced representation across the matters families and businesses face most.'],
    services: [['Family Law', 'Divorce, custody, and support handled with discretion and care. We protect what matters most to you.'], ['Estate Planning', 'Wills, trusts, and powers of attorney that give your family clarity and peace of mind.'], ['Personal Injury', 'If you were hurt by someone else, we pursue the full recovery you deserve. No fee unless we win.'], ['Business Law', 'Formation, contracts, and disputes handled so you can run your company with confidence.'], ['Real Estate', 'Smooth closings and clear contracts for buyers, sellers, and owners.'], ['Wills & Probate', 'Compassionate guidance through probate and the settling of an estate.']],
    servicesCta: ['Not sure where you stand?', 'Book a free consultation and get a clear, honest read on your options.'],
    statsHead: 'A record clients rely on',
    stats: [['30+ Years', 'of combined experience'], ['1,000+ Cases', 'resolved for clients'], ['Free', 'initial consultation'], ['5.0 Stars', 'from those we represent']],
    process: [['Consult', 'Tell us your situation in a free, confidential meeting.'], ['Strategy', 'We map a clear plan and explain every option.'], ['Advocate', 'We handle the filings, negotiations, and hard conversations.'], ['Resolve', 'We pursue the strongest outcome and keep you informed throughout.']],
    faqHead: ['Common questions', 'What to expect when you work with our firm.'],
    faqs: [['How much does a consultation cost?', 'Your initial consultation is free. We will review your situation and explain your options with no obligation.'], ['How are your fees structured?', 'It depends on the matter. Many cases are flat-fee or contingency, and we explain the structure clearly up front.'], ['How long will my case take?', 'Every matter is different, but we give you a realistic timeline early and keep you updated at each step.'], ['Will I work with the same attorney?', 'Yes. A senior attorney handles your case directly, so you always speak with someone who knows the details.']],
    cta: ['Ready when you are', 'Schedule a free, confidential consultation and get clear guidance on your next move.', 'Request consultation'],
    about: ['Experienced advocates in your corner', 'Our attorneys combine deep courtroom experience with genuine care for the people we represent. We take the time to understand what is really at stake for you, explain your options in plain language, and build a strategy around your goals — not a one-size-fits-all template. From the first consultation to the final resolution, we treat every client the way we would want our own family treated.', 'Our commitment', 'Honest counsel, tireless advocacy, and a clear path forward, no matter how complex the matter.'],
    meta: ['An experienced law firm offering family law, estate planning, personal injury, business, and real estate representation.', 'Our practice areas: family law, estate planning, personal injury, business law, real estate, and probate.'],
  },
  restaurant: {
    hero: ['Fresh flavors, made from scratch', 'A neighborhood favorite serving fresh, made-from-scratch food built on local ingredients, honest cooking, and a whole lot of heart — the kind of place you come back to again and again.', 'See the menu', 'Get directions'],
    badges: ['Locally sourced', 'Dine-in & takeout', 'Catering & events'],
    features: [['Made from scratch', 'We make everything in house, from the sauces to the desserts.'], ['Local ingredients', 'We source from nearby farms, so the menu changes with the season.'], ['Warm atmosphere', 'A welcoming spot that feels right for a quick stop or the whole family.'], ['Catering & events', 'From office lunches to celebrations, we bring the flavor to you.'], ['Craft drinks', 'A thoughtful list of drinks to go with whatever you order.'], ['Order ahead', 'Order online or call ahead and skip the wait — or come on in.']],
    servicesHead: ['On the menu', 'Honest, delicious food made fresh every day.'],
    services: [['Chef Specials', 'Seasonal plates the kitchen dreams up each week using the best local finds. Ask your server what is fresh today.'], ['Brunch', 'Weekend favorites from fluffy pancakes to savory hash, plus bottomless coffee.'], ['Dinner', 'Hearty mains and shareable plates made to gather around. Something for every appetite.'], ['Catering', 'Crowd-pleasing spreads for meetings, parties, and celebrations, delivered on time.'], ['Private Events', 'Host your next gathering in our space with a menu built for the occasion.'], ['Desserts', 'House-made sweets worth saving room for, baked fresh daily.']],
    servicesCta: ['Planning a gathering?', 'Ask about catering and private events, and we will make it easy.'],
    statsHead: 'A neighborhood favorite',
    stats: [['15+ Years', 'serving the community'], ['100% Scratch', 'kitchen, every day'], ['4.8 Stars', 'from happy guests'], ['Local', 'farms and suppliers']],
    process: [['Stop in', 'Come by anytime, or order ahead online.'], ['Order', 'Tell us what sounds good and we will make it fresh.'], ['Savor', 'Enjoy fresh, made-from-scratch flavors and friendly service.'], ['Return', 'Come back for the seasonal specials you will not find anywhere else.']],
    faqHead: ['Good to know', 'Answers before you visit.'],
    faqs: [['Can I order ahead or online?', 'Yes — order online or call ahead and we will have it ready. Walk-ins are always welcome too.'], ['Do you offer catering?', 'We do. From office lunches to celebrations, we cater events of every size with fresh, made-to-order food.'], ['Do you have vegetarian or gluten-free options?', 'Plenty. Our menu marks these, and the kitchen is happy to accommodate dietary needs.'], ['Can I host a private event?', 'Absolutely. Reach out and we will help you plan a menu that fits your occasion.']],
    cta: ['Come hungry, leave happy', 'Stop by today and taste the difference fresh, local, and made-from-scratch makes.', 'See the menu'],
    about: ['Good food, made with heart', 'We started with a simple idea: make honest food from local ingredients, pour real care into every order, and treat every guest like family who just walked through the door. Years later, that is still exactly what we do — one fresh, made-from-scratch order at a time.', 'Our kitchen philosophy', 'Fresh over frozen, local over far away, and made from scratch every single day. Great food should taste like someone cared, because we do.'],
    meta: ['A neighborhood eatery serving fresh, made-from-scratch food from local ingredients, with dine-in, takeout, and catering.', 'See the menu: house specials, fresh daily, seasonal treats, plus catering and events for any occasion.'],
  },
  'local-service': {
    hero: ['Reliable service, done right the first time', 'Licensed, insured, and on time. From urgent repairs to planned upgrades, we treat your home like our own — protecting your floors, cleaning up when we finish, and standing behind every job in writing. When something breaks, you get a fast, honest answer and a fair price, never a runaround.', 'Get a free quote', 'Our services'],
    badges: ['Licensed & insured', 'Upfront pricing', 'Same-day service available'],
    features: [['On-time, every time', 'We show up in the window we promise and respect your schedule.'], ['Upfront pricing', 'You approve the price before we start, with no surprise charges.'], ['Licensed & insured', 'Fully credentialed pros protect your home and your peace of mind.'], ['Fast response', 'Urgent problem? We offer same-day and emergency service.'], ['Clean & respectful', 'We protect your floors, tidy up, and treat your home with care.'], ['Workmanship guaranteed', 'If it is not right, we make it right. Simple as that.']],
    servicesHead: ['What we do', 'Dependable repairs, installs, and maintenance for your home.'],
    services: [['Repairs', 'Fast, lasting fixes for the problems that pop up when you least expect them. We diagnose honestly and fix it right.'], ['Installations', 'Expert installation of new fixtures and systems, done to code and built to last.'], ['Maintenance Plans', 'Scheduled tune-ups that prevent breakdowns and extend the life of your equipment.'], ['Emergency Service', 'When something fails after hours, we are ready with fast, same-day help.'], ['Upgrades', 'Modern, efficient upgrades that lower your bills and improve comfort.'], ['Inspections', 'Thorough checks with a clear report, so you know exactly where you stand.']],
    servicesCta: ['Got a project or a problem?', 'Get a free, no-pressure quote and we will handle the rest.'],
    statsHead: 'Homeowners trust our team',
    stats: [['20+ Years', 'serving the area'], ['5,000+ Jobs', 'done right'], ['Same Day', 'service available'], ['4.9 Stars', 'from local homeowners']],
    process: [['Call', 'Tell us the problem and we will schedule a visit fast.'], ['Quote', 'We assess and give you a clear, upfront price.'], ['Fix', 'We do the work cleanly, correctly, and on time.'], ['Guarantee', 'We stand behind every job and back it in writing.']],
    faqHead: ['Questions homeowners ask', 'The details before you book.'],
    faqs: [['Do you offer free estimates?', 'Yes. We provide a clear, no-obligation quote before any work begins.'], ['Are you licensed and insured?', 'We are fully licensed and insured, so your home and our team are protected on every job.'], ['Do you handle emergencies?', 'We do. We offer same-day and after-hours service for urgent problems that cannot wait.'], ['Do you guarantee your work?', 'Every job is backed by our workmanship guarantee. If something is not right, we return and fix it.']],
    cta: ['Need it fixed? We are ready', 'Request your free quote today and get dependable service from a team you can trust.', 'Get a free quote'],
    about: ['Your dependable local pros', 'We built our reputation the hard way: by showing up on time, charging fair prices, and doing honest work that lasts. Our neighbors know they can count on us for everything from a leaky faucet at midnight to a full system upgrade — and they know the price we quote is the price they pay, with no surprises tacked on at the end.', 'How we work', 'Straight answers, upfront pricing, and quality that lasts. We treat your home the way we would treat our own.'],
    meta: ['Licensed, insured local pros offering fast repairs, installations, maintenance, and same-day emergency service.', 'Our services: repairs, installations, maintenance plans, emergency service, upgrades, and inspections.'],
  },
  nonprofit: {
    hero: ['Together, we can do more', 'Every gift and every volunteer hour creates real, lasting change for our neighbors — from warm meals and mentoring for kids to a steady hand up in the hardest moments. Join us and see the difference you make.', 'Donate now', 'Get involved'],
    badges: ['Every dollar counts', '100% local impact', 'Volunteers always welcome'],
    features: [['Real, local impact', 'Your support stays here and helps neighbors who need it most.'], ['Transparent stewardship', 'We share where funds go, so you can give with confidence.'], ['Volunteer-powered', 'Caring people, not overhead, drive the work we do.'], ['Every gift matters', 'Small or large, every donation moves the mission forward.'], ['Community partners', 'We work alongside local groups to reach more people.'], ['Easy ways to help', 'Give, volunteer, or spread the word in just a few minutes.']],
    servicesHead: ['Our programs', 'Practical, caring work that meets real needs in our community.'],
    services: [['Food & Essentials', 'We provide meals and basic necessities to families facing hard times, with dignity and warmth.'], ['Youth Programs', 'Safe spaces, mentoring, and learning that help young people thrive.'], ['Community Outreach', 'We meet people where they are and connect them with the help they need.'], ['Emergency Support', 'Fast assistance for neighbors facing a sudden crisis.'], ['Volunteer Corps', 'Hands-on opportunities to serve, whatever your skills or schedule.'], ['Education & Advocacy', 'We raise awareness and give voice to the people we serve.']],
    servicesCta: ['Ready to make a difference?', 'Give or volunteer today, and help us reach more neighbors.'],
    statsHead: 'The difference we make together',
    stats: [['50k+ Meals', 'served this year'], ['1,200+ Families', 'supported'], ['300+ Volunteers', 'giving their time'], ['100% Local', 'impact you can see']],
    process: [['Give', 'Make a secure donation in just a minute.'], ['Multiply', 'Your gift joins others to fund real programs.'], ['Serve', 'Volunteers turn support into hands-on help.'], ['Change', 'Together we create lasting change for our neighbors.']],
    faqHead: ['Questions supporters ask', 'How your support creates change.'],
    faqs: [['How is my donation used?', 'The large majority of every gift goes directly to programs. We publish our impact so you can see exactly where funds go.'], ['Is my donation tax-deductible?', 'Yes. We are a registered nonprofit and provide a receipt for every gift you make.'], ['How can I volunteer?', 'We welcome volunteers of all backgrounds. Reach out and we will match you with a role that fits your time and skills.'], ['Can my company get involved?', 'Absolutely. We partner with local businesses on giving, sponsorships, and team volunteer days.']],
    cta: ['Your gift changes lives', 'Donate today and help us bring food, hope, and support to neighbors who need it.', 'Donate now'],
    about: ['Neighbors helping neighbors', 'We are a community of donors, volunteers, and staff united by one belief: everyone deserves care, dignity, and a real chance to get back on their feet. Together, we turn that belief into action every single day, meal by meal and neighbor by neighbor.', 'Our mission', 'To meet urgent needs today and build a stronger, more caring community for tomorrow, one neighbor at a time.'],
    meta: ['A local nonprofit providing food, youth programs, outreach, and emergency support. Donate or volunteer to make an impact.', 'Explore our programs: food and essentials, youth programs, outreach, emergency support, and volunteer opportunities.'],
  },
  retail: {
    hero: ['Gear built for how you live', 'Quality goods, honest prices, and fast shipping. Find pieces made to last, backed by people who actually use them.', 'Shop now', 'Browse collections'],
    badges: ['Free shipping over $50', 'Easy 30-day returns', 'Quality guaranteed'],
    features: [['Built to last', 'We stock durable goods that earn their place in your life.'], ['Honest prices', 'Fair pricing on the things you actually want, no gimmicks.'], ['Fast, free shipping', 'Orders over the threshold ship free and arrive quickly.'], ['Easy returns', 'Changed your mind? Send it back within 30 days, no hassle.'], ['Real recommendations', 'Our team uses what we sell and helps you pick right.'], ['Secure checkout', 'Shop with confidence on a fast, protected checkout.']],
    servicesHead: ['Shop the collections', 'Curated goods chosen for quality, not clutter.'],
    services: [['New Arrivals', 'The latest pieces, fresh off the truck. Be the first to grab the drop.'], ['Best Sellers', 'The favorites our customers keep coming back for, proven and popular.'], ['Essentials', 'Everyday staples that never let you down. Stock up on the basics done right.'], ['Seasonal', 'Pieces picked for the season, here for a limited time.'], ['Gifts', 'Thoughtful finds for everyone on your list, ready to give.'], ['Sale', 'Great gear at even better prices while it lasts.']],
    servicesCta: ['Not sure where to start?', 'Browse best sellers or reach out and we will point you the right way.'],
    statsHead: 'Loved by thousands of customers',
    stats: [['10k+ Orders', 'shipped and counting'], ['4.8 Stars', 'from real reviews'], ['30-Day', 'easy returns'], ['Fast', 'free shipping over $50']],
    process: [['Browse', 'Explore curated collections built around quality.'], ['Choose', 'Pick what fits, with honest details on every product.'], ['Checkout', 'Fast, secure, and simple, every time.'], ['Enjoy', 'Get it fast, and love it or return it easily.']],
    faqHead: ['Shopping questions', 'Everything about orders, shipping, and returns.'],
    faqs: [['How much is shipping?', 'Shipping is free on orders over the threshold. Smaller orders ship at a flat, fair rate.'], ['What is your return policy?', 'If it is not right, send it back within 30 days for a refund or exchange. No hassle.'], ['How fast will my order arrive?', 'Most orders ship within a business day and arrive quickly, with tracking every step of the way.'], ['Do you restock sold-out items?', 'Often, yes. Sign up for restock alerts on any product and we will let you know the moment it is back.']],
    cta: ['Find your new favorite', 'Shop quality goods at honest prices, with free shipping and easy returns.', 'Shop now'],
    about: ['Gear we actually stand behind', 'We got tired of flimsy products and inflated prices, so we built a shop around quality and straight talk. We only sell what we would use ourselves.', 'What we believe', 'Buy better, buy less. Great products, fair prices, and service that treats you like a person, not an order number.'],
    meta: ['Quality goods at honest prices with free shipping over $50 and easy 30-day returns. Shop new arrivals and best sellers.', 'Shop our collections: new arrivals, best sellers, essentials, seasonal picks, gifts, and sale items.'],
  },
  saas: {
    hero: ['Ship faster with less busywork', 'The platform that handles the tedious parts so your team can focus on the work that matters. Set up in minutes, not weeks — connect the tools you already use, and let reliable automations quietly run the repetitive work in the background while your team ships.', 'Start free trial', 'See how it works'],
    badges: ['Free 14-day trial', 'No credit card required', 'Cancel anytime'],
    features: [['Fast setup', 'Connect your tools and go live in minutes, not weeks.'], ['Built to scale', 'From your first user to your millionth, performance stays steady.'], ['Secure by default', 'Encryption, access controls, and audit logs come standard.'], ['Automations', 'Replace repetitive manual steps with reliable, hands-off workflows.'], ['Clear analytics', 'See what is working with dashboards your whole team understands.'], ['Helpful support', 'Real humans who answer fast when you need them.']],
    servicesHead: ['What you can do', 'Everything you need to move faster, in one place.'],
    services: [['Workflow Automation', 'Turn manual, repetitive tasks into reliable automated flows. Save hours every week without writing code.'], ['Team Collaboration', 'Keep everyone aligned with shared views, comments, and real-time updates.'], ['Analytics & Reporting', 'Track the numbers that matter with dashboards anyone can read.'], ['Integrations', 'Connect the tools you already use so your data flows in one direction: forward.'], ['Access Controls', 'Give the right people the right access with roles and permissions.'], ['API & Webhooks', 'Build on top of the platform with a clean, well-documented API.']],
    servicesCta: ['Ready to see it in action?', 'Start a free trial or book a quick demo with our team.'],
    statsHead: 'Trusted by growing teams',
    stats: [['10k+ Teams', 'building with us'], ['99.9% Uptime', 'you can rely on'], ['5 Min', 'to get started'], ['24/7', 'support that responds']],
    process: [['Sign up', 'Create your account free, no card required.'], ['Connect', 'Link your existing tools in a few clicks.'], ['Automate', 'Set up flows that run the busywork for you.'], ['Grow', 'Watch your team move faster with less friction.']],
    faqHead: ['Questions teams ask', 'The details before you start.'],
    faqs: [['Is there really a free trial?', 'Yes. You get a full 14-day trial with no credit card required, so you can try everything first.'], ['How long does setup take?', 'Most teams are up and running in minutes. Connect your tools, invite your team, and go.'], ['Is my data secure?', 'Security is built in, with encryption, access controls, and audit logs standard on every plan.'], ['Can I cancel anytime?', 'Of course. There are no long-term contracts, and you can upgrade, downgrade, or cancel whenever you like.']],
    cta: ['Start building today', 'Try it free for 14 days. No credit card, no risk, just less busywork.', 'Start free trial'],
    about: ['Software that respects your time', 'We build tools that get out of the way. Instead of adding one more dashboard to check, we automate the work you never wanted to do by hand — the copy-paste between apps, the manual status updates, the reports nobody has time to run — so your team spends its hours on work that actually moves the business forward.', 'Our approach', 'Simple to start, powerful when you need it, and honest about pricing. Great software should save time, not steal it.'],
    meta: ['A platform that automates busywork so your team ships faster. Free 14-day trial, no credit card, cancel anytime.', 'Explore features: workflow automation, collaboration, analytics, integrations, access controls, and a developer API.'],
  },
  'real-estate': {
    hero: ['Find the home that fits your life', 'A local guide for buyers and sellers who value straight answers. We know these streets, price it right, and stay in your corner from the first tour to the closing table.', 'Browse homes', 'Book a consultation'],
    badges: ['Local market experts', 'Buyers and sellers welcome', 'Honest, no-pressure guidance'],
    features: [['Local market knowledge', 'We live and work here, so you get real insight on neighborhoods, schools, and true home values.'], ['Priced with real data', 'We back every number with recent sales, not guesswork, so you buy or list with confidence.'], ['Guidance at every step', 'From the first showing to the signed contract, you always know what comes next and why.'], ['A calm hand to negotiate', 'We advocate hard for your bottom line and keep the deal moving without the drama.'], ['First-time buyer friendly', 'Never bought before? We explain each step in plain language and answer every question.'], ['Connected to the pros', 'Lenders, inspectors, and contractors we trust, ready when you need a reliable referral.']],
    servicesHead: ['Guidance for every move', 'Whether you are buying your first home or selling your last, we make the whole process clear and calm.'],
    services: [['Buying a Home', 'We help you find the right home at the right price, from the first tour to the keys in your hand. You get honest advice on every listing and a steady guide through offers, inspections, and closing.'], ['Selling Your Home', 'We prepare, price, and market your home to sell for its true value with as little stress as possible. You get a clear plan, sharp photos, and a negotiator who protects your bottom line.'], ['Home Valuation', 'Curious what your home is worth today? We give you an honest, data-backed estimate based on recent local sales, so you can plan your next move with real numbers, not a guess.'], ['Market Analysis', 'We break down what is really happening in your neighborhood, from prices to days on market, so you can time your buy or sale with clear eyes and confidence.'], ['Staging & Prep', 'Small changes sell homes. We advise on the repairs, cleaning, and simple staging that help your home show its best and attract stronger offers, without overspending.'], ['Relocation', 'Moving to or from the area? We make a new place feel familiar fast, with neighborhood guidance, trusted referrals, and a plan that keeps your move on track.']],
    servicesCta: ['Not sure where to start?', 'Book a friendly, no-pressure consultation and we will map your next move together.'],
    statsHead: 'Neighbors trust our guidance',
    stats: [['15+ Years', 'guiding local buyers and sellers'], ['500+ Homes', 'sold and settled'], ['4.9 Stars', 'from clients we have helped'], ['Local', 'expertise you can rely on']],
    process: [['Meet', 'Tell us your goals and timeline in a relaxed, no-pressure chat.'], ['Plan', 'We map a clear strategy and honest pricing for your buy or sale.'], ['Guide', 'We handle showings, offers, and paperwork, and keep you informed.'], ['Close', 'We negotiate hard, protect your interests, and hand you the keys.']],
    faqHead: ['Questions buyers and sellers ask', 'Straight answers about pricing, timing, and the whole process.'],
    faqs: [['How much is my home worth?', 'We give you a free, honest valuation. It is based on recent sales near you and the real condition of your home. You get a clear number to plan around. There is no obligation and no inflated promise.'], ['How much does it cost to work with you as a buyer?', 'In most cases, buyer representation costs you nothing out of pocket, since the seller typically covers the commission. We explain exactly how it works up front, so there are no surprises.'], ['I have never bought a home before. Can you help?', 'Absolutely. We love guiding first-time buyers. We walk you through financing, showings, offers, and closing in plain language, and we answer every question along the way, however small.'], ['How long does it take to buy or sell?', 'It depends on the market and your goals, but we give you a realistic timeline from the start and keep you updated at every step, so you are never left wondering what comes next.']],
    cta: ['Ready to make your move?', 'Whether you are buying, selling, or just exploring, book a friendly consultation and get honest local guidance you can trust.', 'Book a consultation'],
    about: ['Local guidance you can trust', 'We are local agents who treat your move like our own. We take time to understand your goals, explain every option in plain language, and guide you calmly from the first tour to the closing table.', 'What drives us', 'Helping neighbors find the right home and sell for its true value, with honest advice and zero pressure. Your trust matters more to us than any single sale.'],
    meta: ['A local real-estate team helping buyers and sellers with home tours, honest pricing, valuations, staging, and relocation.', 'Our services: buying a home, selling your home, home valuation, market analysis, staging and prep, and relocation.'],
  },
  agency: {
    hero: ['Ideas that move the needle', 'We design brands and campaigns that get noticed and get results. Strategy first, beautiful work always.', 'Start a project', 'See our work'],
    badges: ['Results-driven', 'Senior team, no handoffs', 'Clear, fixed scopes'],
    features: [['Strategy first', 'We start with your goals, not a template, so the work actually performs.'], ['Senior talent', 'Experienced people do your work directly, start to finish.'], ['Measurable results', 'We tie creative to outcomes and report on what moves.'], ['On time, on scope', 'Clear timelines and fixed scopes, so there are no surprises.'], ['Full-service', 'Brand, web, and campaigns handled under one roof.'], ['True partnership', 'We act like an extension of your team, not a vendor.']],
    servicesHead: ['What we do', 'Strategy, design, and campaigns that work together.'],
    services: [['Brand Identity', 'Logos, systems, and voice that make you unmistakable. We build brands that last, not trends that fade.'], ['Web Design & Build', 'Fast, beautiful sites that turn visitors into customers. Designed to convert, built to scale.'], ['Marketing Campaigns', 'Full-funnel campaigns that get attention and drive action across every channel.'], ['Content & Social', 'Content people actually want, planned and produced to grow your audience.'], ['SEO & Growth', 'Sustainable growth built on real search demand, not shortcuts.'], ['Creative Direction', 'A guiding vision that keeps every piece sharp, consistent, and on brand.']],
    servicesCta: ['Have a project in mind?', 'Tell us your goals and we will map a plan to hit them.'],
    statsHead: 'Work that delivers',
    stats: [['200+ Projects', 'shipped for clients'], ['15+ Years', 'of combined craft'], ['3x Avg', 'return on campaigns'], ['Senior', 'team on every project']],
    process: [['Discover', 'We dig into your goals, audience, and market.'], ['Design', 'We craft strategy and creative built to perform.'], ['Launch', 'We ship polished work on time and on scope.'], ['Measure', 'We track results and refine what works.']],
    faqHead: ['Working with us', 'The answers clients want up front.'],
    faqs: [['How much does a project cost?', 'It depends on scope, but every engagement has a clear, fixed price agreed up front. No surprise invoices.'], ['How long will it take?', 'We share a realistic timeline before we start and hit it. Most brand and web projects run a few weeks to a couple of months.'], ['Who actually does the work?', 'Senior specialists handle your project directly. There are no junior handoffs behind the scenes.'], ['Do you work with our in-house team?', 'Often, yes. We plug in as an extension of your team and hand off cleanly when the work is done.']],
    cta: ['Let us build something great', 'Tell us about your project and we will show you how we can help.', 'Start a project'],
    about: ['A studio built on results', 'We are a small team of senior designers, strategists, and marketers who care about outcomes as much as aesthetics. Beautiful work that does not perform is just decoration.', 'How we think', 'Strategy before style, results before awards, and honesty at every step. We win when you win.'],
    meta: ['A results-driven creative agency offering brand identity, web design, marketing campaigns, content, and SEO.', 'Our services: brand identity, web design, marketing campaigns, content and social, SEO, and creative direction.'],
  },
  portfolio: {
    hero: ['Work I am proud to share', 'I craft thoughtful, polished projects that help brands and people stand out. Take a look, then let us make something together.', 'View my work', 'Get in touch'],
    badges: ['Available for projects', 'Fast, clear communication', 'Detail-obsessed'],
    features: [['Craft over hype', 'I sweat the details so the final work feels effortless.'], ['Clear process', 'You always know where a project stands and what comes next.'], ['Reliable delivery', 'I hit deadlines and communicate early if anything shifts.'], ['Tailored, not templated', 'Every project starts from your goals, never a canned formula.'], ['Easy to work with', 'Straight talk, quick replies, and zero ego.'], ['Built to last', 'Work made to hold up long after launch day.']],
    servicesHead: ['What I make', 'A focused set of things I do really well.'],
    services: [['Design', 'Clean, purposeful design that communicates clearly and looks the part. Form that follows the goal.'], ['Photography', 'Striking, story-driven images that capture the real thing, beautifully.'], ['Branding', 'Identities with a point of view, built to be remembered.'], ['Web Projects', 'Fast, elegant sites that feel as good as they look.'], ['Consulting', 'A second set of expert eyes to sharpen your work and direction.'], ['Collaborations', 'I love teaming up with good people on ambitious projects.']],
    servicesCta: ['Have something in mind?', 'Tell me about your project and I will let you know how I can help.'],
    statsHead: 'A bit of proof',
    stats: [['120+ Projects', 'delivered'], ['10+ Years', 'honing the craft'], ['Repeat', 'clients who come back'], ['Available', 'for new work now']],
    process: [['Connect', 'Tell me about your project and goals.'], ['Plan', 'I map a clear scope, timeline, and price.'], ['Create', 'I do the work with care and keep you posted.'], ['Deliver', 'You get polished, ready-to-use results.']],
    faqHead: ['Before we start', 'The things people usually ask.'],
    faqs: [['Are you available for new projects?', 'Yes, I am currently taking on new work. Reach out and let us find a time to talk.'], ['How do you price your work?', 'I scope each project individually and give you a clear, fixed quote before we begin.'], ['What is your turnaround?', 'It depends on the project, but I share a realistic timeline up front and keep you updated throughout.'], ['Do you work remotely?', 'Absolutely. I work with clients anywhere and keep communication clear and easy from start to finish.']],
    cta: ['Let us make something great', 'I am available for new projects. Tell me what you have in mind and let us talk.', 'Get in touch'],
    about: ['Hi, I am glad you are here', 'I am an independent maker who cares deeply about craft and the people I work with. I take on a handful of projects at a time so each one gets my full attention.', 'What drives me', 'The joy of making something genuinely good, and the trust of a client who is thrilled with the result. That is the whole job.'],
    meta: ['An independent designer and maker crafting thoughtful design, photography, branding, and web projects. Available now.', 'What I offer: design, photography, branding, web projects, consulting, and collaborations. Currently available.'],
  },
};

// Per-vertical hero + about photos (real, relevant, allowlisted images.unsplash.com
// URLs fetched from the Unsplash API). Baked into the packs so a generated site has
// real imagery even when the orchestrator's image pipeline crashes. Refresh with:
//   UNSPLASH_KEY=$(get-secret UNSPLASH_ACCESS_KEY) node scripts/fetch-vertical-images.mjs
const IMG = {
  "medical": { hero: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?crop=entropy&cs=tinysrgb&fit=max&auto=format&q=80&w=1080", about: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?crop=entropy&cs=tinysrgb&fit=max&auto=format&q=80&w=1080", aboutAlt: "friendly doctor talking with a patient in a bright clinic" },
  "dental": { hero: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?crop=entropy&cs=tinysrgb&fit=max&auto=format&ixid=M3w5MTc1ODN8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBkZW50YWwlMjBjbGluaWMlMjBpbnRlcmlvcnxlbnwxfDB8fHwxNzg3NTg1NjUxfDA&ixlib=rb-4.1.0&q=80&w=1080", about: "https://images.unsplash.com/photo-1606811842243-af7e16970c1f?crop=entropy&cs=tinysrgb&fit=max&auto=format&ixid=M3w5MTc1ODN8MHwxfHNlYXJjaHwxfHxzbWlsaW5nJTIwZGVudGlzdCUyMHdpdGglMjBwYXRpZW50fGVufDF8MHx8fDE3ODc1ODU2NTF8MA&ixlib=rb-4.1.0&q=80&w=1080", aboutAlt: "man in white dress shirt sitting on black office rolling chair" },
  "wellness": { hero: "https://images.unsplash.com/photo-1676496962536-d8ef110ff6f0?crop=entropy&cs=tinysrgb&fit=max&auto=format&ixid=M3w5MTc1ODN8MHwxfHNlYXJjaHwxfHxzZXJlbmUlMjB5b2dhJTIwc3R1ZGlvJTIwaW50ZXJpb3J8ZW58MXwwfHx8MTc4NzU4NTY1Mnww&ixlib=rb-4.1.0&q=80&w=1080", about: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?crop=entropy&cs=tinysrgb&fit=max&auto=format&ixid=M3w5MTc1ODN8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHByYWN0aWNpbmclMjB5b2dhfGVufDF8MHx8fDE3ODc1ODU2NTN8MA&ixlib=rb-4.1.0&q=80&w=1080", aboutAlt: "silhouette photography of woman doing yoga" },
  "fitness": { hero: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?crop=entropy&cs=tinysrgb&fit=max&auto=format&ixlib=rb-4.1.0&q=80&w=1080", about: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?crop=entropy&cs=tinysrgb&fit=max&auto=format&ixlib=rb-4.1.0&q=80&w=1080", aboutAlt: "person lifting a loaded barbell in a gym" },
  "legal": { hero: "https://images.unsplash.com/photo-1781136230118-3272607eb34c?crop=entropy&cs=tinysrgb&fit=max&auto=format&ixid=M3w5MTc1ODN8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBsYXclMjBvZmZpY2UlMjBpbnRlcmlvcnxlbnwxfDB8fHwxNzg3NTg1NjUzfDA&ixlib=rb-4.1.0&q=80&w=1080", about: "https://images.unsplash.com/photo-1662104935883-e9dd0619eaba?crop=entropy&cs=tinysrgb&fit=max&auto=format&ixid=M3w5MTc1ODN8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBsYXd5ZXIlMjBwb3J0cmFpdHxlbnwxfDB8fHwxNzg3NTg1NjUzfDA&ixlib=rb-4.1.0&q=80&w=1080", aboutAlt: "a woman in a black suit" },
  "restaurant": { hero: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?crop=entropy&cs=tinysrgb&fit=max&auto=format&ixid=M3w5MTc1ODN8MHwxfHNlYXJjaHwxfHx3YXJtJTIwcmVzdGF1cmFudCUyMGludGVyaW9yJTIwZGluaW5nfGVufDF8MHx8fDE3ODc1ODU2NTR8MA&ixlib=rb-4.1.0&q=80&w=1080", about: "https://images.unsplash.com/photo-1577106263724-2c8e03bfe9cf?crop=entropy&cs=tinysrgb&fit=max&auto=format&ixid=M3w5MTc1ODN8MHwxfHNlYXJjaHwxfHxjaGVmJTIwcGxhdGluZyUyMGdvdXJtZXQlMjBmb29kfGVufDF8MHx8fDE3ODc1ODU2NTV8MA&ixlib=rb-4.1.0&q=80&w=1080", aboutAlt: "person putting food on plate" },
  "local-service": { hero: "https://images.unsplash.com/photo-1676210134188-4c05dd172f89?crop=entropy&cs=tinysrgb&fit=max&auto=format&ixid=M3w5MTc1ODN8MHwxfHNlYXJjaHwxfHxwbHVtYmVyJTIwcmVwYWlyaW5nJTIwcGlwZXN8ZW58MXwwfHx8MTc4NzU4NTY1NXww&ixlib=rb-4.1.0&q=80&w=1080", about: "https://images.unsplash.com/photo-1581166397057-235af2b3c6dd?crop=entropy&cs=tinysrgb&fit=max&auto=format&ixid=M3w5MTc1ODN8MHwxfHNlYXJjaHwxfHxzZXJ2aWNlJTIwdGVjaG5pY2lhbiUyMHRvb2xzfGVufDF8MHx8fDE3ODc1ODU2NTZ8MA&ixlib=rb-4.1.0&q=80&w=1080", aboutAlt: "red and silver hand tool" },
  "nonprofit": { hero: "https://images.unsplash.com/photo-1628717341663-0007b0ee2597?crop=entropy&cs=tinysrgb&fit=max&auto=format&ixid=M3w5MTc1ODN8MHwxfHNlYXJjaHwxfHxjb21tdW5pdHklMjB2b2x1bnRlZXJzJTIwaGVscGluZ3xlbnwxfDB8fHwxNzg3NTg1NjU2fDA&ixlib=rb-4.1.0&q=80&w=1080", about: "https://images.unsplash.com/photo-1618521715147-29e4b97e2ebd?crop=entropy&cs=tinysrgb&fit=max&auto=format&ixid=M3w5MTc1ODN8MHwxfHNlYXJjaHwxfHxncm91cCUyMG9mJTIwdm9sdW50ZWVycyUyMHNtaWxpbmd8ZW58MXwwfHx8MTc4NzU4NTY1Nnww&ixlib=rb-4.1.0&q=80&w=1080", aboutAlt: "group of people standing on brown soil during daytime" },
  "retail": { hero: "https://images.unsplash.com/photo-1774796425589-c9cf9c919de9?crop=entropy&cs=tinysrgb&fit=max&auto=format&ixid=M3w5MTc1ODN8MHwxfHNlYXJjaHwxfHxjb3p5JTIwaW5kZXBlbmRlbnQlMjBzaG9wJTIwaW50ZXJpb3IlMjBzaGVsdmVzfGVufDF8MHx8fDE3ODkyMzMwMDh8MA&ixlib=rb-4.1.0&q=80&w=1080", about: "https://images.unsplash.com/photo-1764795849885-e226e3cabe87?crop=entropy&cs=tinysrgb&fit=max&auto=format&ixid=M3w5MTc1ODN8MHwxfHNlYXJjaHwxfHxzaG9wa2VlcGVyJTIwYXJyYW5naW5nJTIwcHJvZHVjdHMlMjBvbiUyMHNoZWx2ZXN8ZW58MXwwfHx8MTc4OTIzMzAwOHww&ixlib=rb-4.1.0&q=80&w=1080", aboutAlt: "a shop owner organizing products on the shelves" },
  "saas": { hero: "https://images.unsplash.com/photo-1551434678-e076c223a692?crop=entropy&cs=tinysrgb&fit=max&auto=format&ixid=M3w5MTc1ODN8MHwxfHNlYXJjaHwxfHxzb2Z0d2FyZSUyMHRlYW0lMjB3b3JraW5nJTIwbGFwdG9wcyUyMG9mZmljZXxlbnwxfDB8fHwxNzg3NTg1NjU4fDA&ixlib=rb-4.1.0&q=80&w=1080", about: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?crop=entropy&cs=tinysrgb&fit=max&auto=format&ixid=M3w5MTc1ODN8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB0ZWNoJTIwc3RhcnR1cCUyMHdvcmtzcGFjZXxlbnwxfDB8fHwxNzg3NTg1NjU4fDA&ixlib=rb-4.1.0&q=80&w=1080", aboutAlt: "group of people using laptop computer" },
  "real-estate": { hero: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?crop=entropy&cs=tinysrgb&fit=max&auto=format&ixlib=rb-4.1.0&q=80&w=1080", about: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?crop=entropy&cs=tinysrgb&fit=max&auto=format&ixlib=rb-4.1.0&q=80&w=1080", aboutAlt: "real-estate agent handing house keys to a happy couple" },
  "agency": { hero: "https://images.unsplash.com/photo-1568992687947-868a62a9f521?crop=entropy&cs=tinysrgb&fit=max&auto=format&ixid=M3w5MTc1ODN8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGFnZW5jeSUyMHRlYW0lMjBtZWV0aW5nfGVufDF8MHx8fDE3ODc1ODU2NTl8MA&ixlib=rb-4.1.0&q=80&w=1080", about: "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?crop=entropy&cs=tinysrgb&fit=max&auto=format&ixid=M3w5MTc1ODN8MHwxfHNlYXJjaHwxfHxkZXNpZ25lciUyMHdvcmtzcGFjZSUyMGRlc2t8ZW58MXwwfHx8MTc4NzU4NTY1OXww&ixlib=rb-4.1.0&q=80&w=1080", aboutAlt: "MacBook Pro on table beside white iMac and Magic Mouse" },
  "portfolio": { hero: "https://images.unsplash.com/photo-1752650736252-dff5244c8a7a?crop=entropy&cs=tinysrgb&fit=max&auto=format&ixid=M3w5MTc1ODN8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMHBob3RvZ3JhcGhlciUyMHdvcmtzcGFjZXxlbnwxfDB8fHwxNzg3NTg1NjYwfDA&ixlib=rb-4.1.0&q=80&w=1080", about: "https://images.unsplash.com/photo-1650783756107-739513b38177?crop=entropy&cs=tinysrgb&fit=max&auto=format&ixid=M3w5MTc1ODN8MHwxfHNlYXJjaHwxfHxhcnRpc3QlMjB3b3JraW5nJTIwc3R1ZGlvfGVufDF8MHx8fDE3ODc1ODU2NjB8MA&ixlib=rb-4.1.0&q=80&w=1080", aboutAlt: "a person with a red hat writing on a laptop" },
};

// Short, clean alt text for the hero photo per vertical (a11y).
const HERO_ALT = {
  medical: 'Bright, welcoming modern family medicine clinic',
  dental: 'Bright, welcoming modern dental office',
  wellness: 'Calm, sunlit yoga and wellness studio',
  fitness: 'Athlete training with weights in a strength gym',
  legal: 'Professional modern law office interior',
  restaurant: 'Warm, inviting restaurant dining room',
  'local-service': 'Skilled service technician on the job',
  nonprofit: 'Volunteers serving the local community',
  retail: 'Interior of a welcoming local shop stocked with goods',
  saas: 'Team collaborating in a modern office',
  'real-estate': 'Bright, modern home exterior at dusk',
  agency: 'Creative team working together',
  portfolio: 'Creative studio workspace',
};

// Per-vertical heading for the Home gallery section.
const GALLERY_HEADLINE = {
  medical: 'A look inside our practice',
  dental: 'A look inside our practice',
  wellness: 'Inside the studio',
  fitness: 'Inside the gym',
  legal: 'Our firm at work',
  restaurant: 'From our kitchen',
  'local-service': 'Our work in the field',
  nonprofit: 'Our impact in pictures',
  retail: 'The collection',
  saas: 'The product in action',
  'real-estate': 'Homes we have helped sell',
  agency: 'Selected work',
  portfolio: 'Featured work',
};

// Short, punchy per-vertical tagline for the SEO <title> ("Name — Tagline", ~50-60
// chars) + the hero eyebrow. Fills brand.ts's DEFAULTS.tagline token. Name-agnostic, no slop.
const TAGLINE = {
  medical: 'Trusted Primary Care for Every Age',
  dental: 'Gentle Family Dental Care',
  wellness: 'Find Your Calm and Strength',
  fitness: 'Train Hard, Get Strong',
  legal: 'Trusted Counsel When It Matters',
  restaurant: 'Fresh, Local, Made From Scratch',
  'local-service': 'Reliable Service, Done Right',
  nonprofit: 'Together We Do More Good',
  retail: 'Quality Goods at Honest Prices',
  saas: 'Ship Faster, Skip the Busywork',
  'real-estate': 'Homes, Done Right',
  agency: 'Ideas That Move the Needle',
  portfolio: 'Thoughtful, Beautifully Made Work',
};

// Per-vertical homepage META DESCRIPTION (120-156 chars) — the SEO fallback when
// the orchestrator leaves brand.business.description as the bare name. Fills
// {SEO_DESCRIPTION} in Home.tsx so every homepage ships a real, keyword-rich
// description instead of just the business name. Guesses-ahead, generic-but-true.
const DESCRIPTION = {
  medical: 'A welcoming family medicine practice for the whole family — annual physicals, preventive care, chronic-condition management, same-day sick visits, and telehealth in a patient-first office.',
  dental: 'Compassionate, modern dental care for the whole family — gentle checkups, honest advice, and comfortable treatment in a welcoming, patient-first practice.',
  wellness: 'A calm, welcoming space for wellness — expert care, mindful treatments, and a personalized approach that helps you feel your best in both body and mind.',
  fitness: 'A welcoming strength and conditioning gym with expert coaching, barbell training, and classes for every level to help you get strong and stay strong.',
  legal: 'Experienced, straight-talking legal counsel you can trust — clear guidance, responsive service, and dedicated representation for every client we serve.',
  restaurant: 'Fresh, made-from-scratch food from local ingredients, served with friendly care — come in for something delicious and flavors worth coming back for again.',
  'local-service': 'Reliable, licensed, and insured local service done right the first time — fast response, honest upfront pricing, and quality workmanship you can count on.',
  nonprofit: 'Join a community working together for real, lasting good — learn how your time, gifts, and support create measurable impact for the people we serve.',
  retail: 'Quality goods at honest prices, chosen with care — discover a thoughtfully curated selection and friendly, no-pressure service every time you visit.',
  saas: 'Ship faster and skip the busywork — a modern platform built to streamline your workflow, cut manual effort, and help your team do its best work.',
  'real-estate': 'Local real-estate guidance for buyers and sellers: honest home pricing, sharp neighborhood insight, and calm support from first tour to the closing table.',
  agency: 'Ideas that move the needle — strategy, design, and marketing that turn ambitious goals into measurable growth for brands ready to stand out from the rest.',
  portfolio: 'Thoughtful, beautifully made work across every project — a portfolio built on craft, clarity, and a genuine care for the details that truly matter.',
};

// Sub-page body content the homepage packs didn't cover: About-page intro
// paragraphs + FAQ-page billing/support Q&A (journey 2026-08-25 — Brian: "every
// page full of relevant content that guesses ahead"). Name-agnostic, Flesch >= 60,
// no slop, no fabricated people.
const SUBPAGE = {
  medical: {
    aboutP: [
      'Our practice began with a simple goal: make primary care something you actually look forward to. From the moment you walk in, you are greeted by name, listened to, and treated with patience. We take time to explain what we see and why it matters, so you always leave knowing exactly where your health stands.',
      'Over the years we have grown, but our approach has not changed. We invest in modern diagnostics, keep our pricing clear, and welcome patients of every age. Whether it is an annual physical or a sudden fever, you can count on honest advice and a comfortable visit every time.',
    ],
    faqBill: [
      ['Do you accept insurance and payment plans?', 'We accept most major health plans and file the claims for you. For services not fully covered, we offer flexible payment options so cost never stands between you and good care.'],
      ['Will I know the cost before my visit?', 'Whenever we can, yes. We check your benefits and explain any expected cost up front, so there are as few surprises as possible on your bill.'],
    ],
    faqSup: [
      ['What are your office hours?', 'We offer appointments throughout the week, including early and evening slots for busy schedules. Call or book online and we will find a time that works for you.'],
      ['How do I schedule my first visit?', 'Booking is easy. Use the contact form or give us a call, and our friendly front desk will get you scheduled and answer any questions before you arrive.'],
    ],
  },
  dental: {
    aboutP: [
      'Our practice began with a simple goal: make going to the dentist something you never dread. From the moment you walk in, you are greeted by name, listened to, and treated with patience. We take time to explain what we see and why it matters, so you always leave knowing exactly where your health stands.',
      'Over the years we have grown, but our approach has not changed. We invest in gentle, modern technology, keep our pricing clear, and welcome patients of every age. Whether it is a routine cleaning or an unexpected emergency, you can count on honest advice and a comfortable visit every time.',
    ],
    faqBill: [
      ['Do you accept insurance and payment plans?', 'We accept most major dental plans and file the claims for you. For treatments not fully covered, we offer flexible payment options so cost never stands between you and a healthy smile.'],
      ['Will I know the cost before treatment?', 'Always. We review the full cost and your insurance estimate with you before any work begins, so there are never surprises on your bill.'],
    ],
    faqSup: [
      ['What are your office hours?', 'We offer appointments throughout the week, including early and evening slots for busy schedules. Call or book online and we will find a time that works for you.'],
      ['How do I schedule my first visit?', 'Booking is easy. Use the contact form or give us a call, and our friendly front desk will get you scheduled and answer any questions before you arrive.'],
    ],
  },
  wellness: {
    aboutP: [
      'We opened our doors to create a space where anyone could move, breathe, and feel a little more at home in their body. No cliques, no competition, just steady practice and a community that cheers each other on. Every class is a chance to slow down and reconnect.',
      'Our certified instructors meet you exactly where you are, offering options for every level and every body. Whether you are here to build strength, ease stress, or simply carve out an hour for yourself, you will find a warm welcome and plenty of encouragement on the mat.',
    ],
    faqBill: [
      ['What membership and class options do you offer?', 'We keep it flexible with drop-ins, class packs, and monthly memberships. Choose what fits your schedule and your budget, and change it anytime as your practice grows.'],
      ['Is there a cost for my first class?', 'Your first class is on us. Come try the studio, meet an instructor, and see how it feels before you commit to anything.'],
    ],
    faqSup: [
      ['What should I bring and wear?', 'Just comfortable clothes you can move in and a bottle of water. We provide mats and props, so you can arrive with nothing but an open mind.'],
      ['How do I reserve a spot?', 'Reserve your mat online in under a minute, and we will send a friendly reminder before class. Walk-ins are welcome too, based on space.'],
    ],
  },
  fitness: {
    aboutP: [
      'We opened this gym to prove that getting strong does not require an intimidating room full of egos. From your very first session, a coach learns your goals, checks how you move, and builds a plan that meets you where you are. You are greeted by name, cheered on by the crew, and shown exactly how to train safely and well.',
      'Our certified coaches care as much about your technique as your total, so you build real strength without getting hurt. Whether you want to squat your first barbell, chase a bigger deadlift, or simply feel better in daily life, you will find hands-on coaching, a clear path forward, and a community that shows up right beside you.',
    ],
    faqBill: [
      ['What membership options do you offer?', 'We keep it simple with month-to-month memberships, class packs, and drop-ins. Pick what fits your schedule and budget, and change it anytime as your training grows. There are no long contracts and no hidden fees.'],
      ['Is my first session really free?', 'Yes. Your first session is on us. Come train, meet the coaches, and see how the gym feels before you commit to anything at all.'],
    ],
    faqSup: [
      ['What should I bring and wear?', 'Just training clothes, athletic shoes, and a water bottle. We provide all the equipment you need, so you can walk in and get straight to work.'],
      ['How do I book my first session?', 'Booking takes under a minute online, or give us a call and we will get you scheduled. We will confirm a time and answer any questions before you arrive.'],
    ],
  },
  legal: {
    aboutP: [
      'Our firm was built on a belief that everyone deserves clear guidance and a strong advocate, especially in stressful moments. We take time to understand your situation, explain your options in plain language, and stand beside you from the first meeting to the final resolution.',
      'When you work with us, a senior attorney handles your case directly. You are never passed down the hall or left wondering what comes next. We keep you informed, return your calls, and fight for the outcome you deserve with honesty and care.',
    ],
    faqBill: [
      ['How do your fees work?', 'It depends on your matter. Many cases are handled on a flat fee or contingency basis, and we explain the full structure clearly before you sign anything, so you always know what to expect.'],
      ['Is the first consultation really free?', 'Yes. Your initial consultation is free and confidential. We will review your situation, answer your questions, and outline your options with no obligation.'],
    ],
    faqSup: [
      ['How quickly will you respond?', 'We know timing often matters. We answer questions promptly and keep you updated at every step, so you are never left waiting in the dark.'],
      ['How do I get started?', 'Reach out through the contact form or give us a call to schedule your free consultation. We will handle the details from there.'],
    ],
  },
  restaurant: {
    aboutP: [
      'We started with a simple idea: cook honest food from local ingredients and treat every guest like family. From the first cup of coffee to the last bite of dessert, everything is made in house, from scratch, with care you can taste.',
      'Our menu changes with the seasons because the best flavors come from what is fresh and nearby. Whether you are here for a quiet dinner, a weekend brunch, or a celebration with friends, we save you a warm seat and a plate worth savoring.',
    ],
    faqBill: [
      ['Do you take reservations, and is there a deposit?', 'You can book a table online or by phone at no charge. For large parties and private events we may ask for a small deposit, which goes toward your final bill.'],
      ['Do you offer gift cards?', 'We do. Gift cards are a favorite for birthdays and holidays, and you can pick one up in person or ask us about ordering one.'],
    ],
    faqSup: [
      ['What are your hours?', 'We serve lunch and dinner through the week with brunch on weekends. Check the top of the page for today’s hours, or give us a call anytime.'],
      ['Can you handle dietary needs?', 'Absolutely. Our menu marks vegetarian and gluten-free dishes, and our kitchen is always happy to accommodate allergies and preferences. Just let your server know.'],
    ],
  },
  'local-service': {
    aboutP: [
      'We built our reputation the hard way, one honest job at a time. When you call, you reach people who actually show up when they say they will, charge a fair price, and treat your home with respect. No runaround, no surprise fees, just dependable work.',
      'Our team is fully licensed and insured, and every job is backed by our workmanship guarantee. From a small repair to a major upgrade, we take time to do it right the first time and leave your home cleaner than we found it.',
    ],
    faqBill: [
      ['Are estimates really free?', 'Yes. We provide a clear, no-obligation quote before any work begins, so you can decide with full information and zero pressure.'],
      ['How and when do I pay?', 'You approve the price up front and pay once the work is complete and you are satisfied. We accept convenient payment options and never add surprise charges.'],
    ],
    faqSup: [
      ['Do you offer same-day or emergency service?', 'We do. For urgent problems that cannot wait, we reserve same-day and after-hours slots to get your home back to normal fast.'],
      ['What areas do you serve?', 'We proudly serve our local community and the surrounding area. Give us a call and we will confirm we cover your neighborhood.'],
    ],
  },
  nonprofit: {
    aboutP: [
      'We are a community of donors, volunteers, and staff united by one belief: everyone deserves care and a real chance. What began as a small effort to help a few neighbors has grown into a mission that reaches families across our community every single week.',
      'Because we are powered by volunteers and guided by careful stewardship, the large majority of every gift goes straight to the people we serve. We share our impact openly, so you can give and serve with full confidence that your support truly makes a difference.',
    ],
    faqBill: [
      ['Is my donation tax-deductible?', 'Yes. We are a registered nonprofit, and we send a receipt for every gift so you have what you need at tax time.'],
      ['How is my donation used?', 'The large majority of every dollar funds our programs directly. We share our results openly so you can see exactly how your generosity turns into real help.'],
    ],
    faqSup: [
      ['How can I volunteer?', 'We welcome volunteers of all backgrounds and schedules. Reach out and we will match you with a role that fits your time and talents.'],
      ['How can my company or group help?', 'We partner with local businesses and groups on giving, sponsorships, and team volunteer days. Contact us and we will find a meaningful way to get involved.'],
    ],
  },
  retail: {
    aboutP: [
      'We got tired of flimsy products and inflated prices, so we built a shop around quality and straight talk. Every item we carry has earned its place, chosen by people who actually use what they sell and want you to love what you buy.',
      'Our promise is simple: great products, fair prices, and service that treats you like a person, not an order number. If something is not right, we make it easy to return, because your trust matters far more than any single sale.',
    ],
    faqBill: [
      ['How much does shipping cost?', 'Shipping is free on orders over the listed threshold, and smaller orders ship at a flat, fair rate. You will see the exact cost before you check out.'],
      ['Is checkout secure?', 'Yes. Our checkout is fast and fully protected, so you can shop with total confidence that your information is safe.'],
    ],
    faqSup: [
      ['What is your return policy?', 'If it is not right, send it back within 30 days for a refund or exchange. No hassle and no hard questions.'],
      ['How do I track my order?', 'Once your order ships, we send tracking so you can follow it to your door. Reach out anytime and we will help you check on it.'],
    ],
  },
  saas: {
    aboutP: [
      'We build tools that get out of the way. Instead of adding one more dashboard to check, we automate the tedious work you never wanted to do by hand, so your team can spend its energy on the things that actually move the business forward.',
      'From your first user to your millionth, our platform stays fast, secure, and simple to use. We are honest about pricing, quick to help when you need us, and relentlessly focused on saving you time. Great software should feel like a teammate, not a chore.',
    ],
    faqBill: [
      ['How does pricing work?', 'We offer clear, flat plans with no hidden fees. Start on the free trial, then choose the plan that fits your team. You can upgrade, downgrade, or cancel anytime.'],
      ['Do I need a credit card to try it?', 'No. Your 14-day trial requires no credit card, so you can explore everything risk-free before you decide.'],
    ],
    faqSup: [
      ['How do I get help if I am stuck?', 'Real people answer fast. Reach our support team by chat or email and we will get you unblocked quickly, with no phone trees or canned replies.'],
      ['How long does setup take?', 'Most teams are up and running in minutes. Connect your existing tools, invite your team, and you are ready to go.'],
    ],
  },
  'real-estate': {
    aboutP: [
      'We started helping neighbors buy and sell homes because the process should feel guided, not overwhelming. From the first conversation, we listen to your goals, learn your timeline, and explain each step in plain language. You always know what is happening and why, so a big decision feels a lot less stressful.',
      'We know these streets, schools, and price trends because this is our community too. Whether you are touring your first home or listing the one where you raised a family, you get honest advice, sharp pricing, and a steady advocate who keeps the deal moving all the way to the closing table.',
    ],
    faqBill: [
      ['What does it cost to work with you?', 'For buyers, our help usually costs nothing out of pocket, since the seller typically covers the commission. For sellers, we explain our fee clearly before you list, so you know exactly what to expect with no surprises.'],
      ['When do I pay any fees?', 'Commissions come out of the sale at closing, not up front, so you are never asked to write a check to get started. We walk you through every number on the closing statement well before the day itself.'],
    ],
    faqSup: [
      ['How do I start a home search or listing?', 'It is easy. Send a message or give us a call, and we will set up a relaxed, no-pressure chat to learn your goals. From there we build a plan and get you touring homes or ready to list.'],
      ['Can you recommend a lender or inspector?', 'Yes. We work with trusted local lenders, inspectors, and contractors and are glad to share referrals. You are never obligated to use them, but many clients appreciate a reliable place to start.'],
    ],
  },
  agency: {
    aboutP: [
      'We are a small team of senior designers, strategists, and marketers who care about outcomes as much as aesthetics. We started this studio because beautiful work that does not perform is just decoration, and our clients deserve both.',
      'When you hire us, experienced people do your work directly, from the first idea to the final launch. We start with your goals, tie every creative choice to results, and hit our deadlines. We win when you win, and we treat your business like our own.',
    ],
    faqBill: [
      ['How much will a project cost?', 'Every engagement has a clear, fixed price agreed up front, based on your scope and goals. No surprise invoices, ever.'],
      ['What does the payment schedule look like?', 'We typically split projects into a few simple milestones, so payments line up with progress and you always know what you are paying for.'],
    ],
    faqSup: [
      ['Who will I actually work with?', 'Senior specialists handle your project directly. There are no junior handoffs behind the scenes, so you always speak with the people doing the work.'],
      ['How do we get started?', 'Tell us about your goals through the contact form or a quick call. We will map a plan, share a clear quote, and get moving.'],
    ],
  },
  portfolio: {
    aboutP: [
      'I am an independent maker who cares deeply about craft and the people I work with. I take on a handful of projects at a time so each one gets my full attention, and I sweat the small details so the final work feels effortless.',
      'Every project starts from your goals, never a canned formula. I keep communication clear and easy, hit my deadlines, and build work that holds up long after launch day. My favorite part of the job is a client who is genuinely thrilled with the result.',
    ],
    faqBill: [
      ['How do you price your work?', 'I scope each project individually and give you a clear, fixed quote before we begin, so you know exactly what to expect.'],
      ['What is your payment schedule?', 'I usually work in a couple of simple milestones, with a deposit to start and the balance on delivery. I am always happy to talk through what works for you.'],
    ],
    faqSup: [
      ['Are you available for new projects?', 'Yes, I am currently taking on new work. Reach out and let us find a time to talk about what you have in mind.'],
      ['Do you work remotely?', 'Absolutely. I work with clients anywhere and keep communication clear and simple from start to finish.'],
    ],
  },
};

// Deep sub-page content (journey 2026-08-26 — Brian: EVERY page /about /services
// /faq /contact must render 500+ words across SEVERAL sections, not one thin block).
// Per vertical:
//   aboutP34   — two more About body paragraphs (history + what-to-expect)
//   values     — 3× {title, desc} for the "What we stand for" grid
//   approach   — [title, text] for the "How we work" band
//   servicesIntro — intro paragraph above the Services grid
//   serviceLong — 6 ~70-90-word expansions (Services page uses these, not the short homepage ones)
//   why        — 3× {title, desc} for the Services "Why choose us" band
//   contactIntro — reassuring intro paragraph above the Contact form
//   faqMore    — 4 extra Q&A (40-60-word answers) → FAQ page reaches 10-12 items
// Name-agnostic (no {TOKEN} inside values), Flesch-friendly, no slop, no fabricated people.
const SUB2 = {
  medical: {
    aboutP34: [
      'What sets us apart is the time we take. We never rush you out the door or order tests you do not need. Instead, we walk you through every result, answer questions in plain language, and build a plan around your priorities, your health, and your budget. Many of our patients have been with us for a decade or more, and their children now come to us too.',
      'Behind the warm welcome is a genuinely modern practice. On-site labs get you answers faster and cut the extra trips. Secure telehealth handles minor concerns and follow-ups from home. Careful screenings catch problems early, and online booking with automatic reminders means you spend less time on the phone and more time living your life.',
    ],
    values: [
      ['Care without the rush', 'Real appointment time, a doctor who listens, and a team that checks in often. If something is worrying you, we make room for it. Your health matters more than the schedule.'],
      ['Honesty you can feel', 'We only recommend what we would choose for our own family. You get clear options, real costs, and the freedom to ask questions until it makes sense.'],
      ['Care for every age', 'Toddlers, teens, parents, and grandparents share one trusted practice. We grow with your family and keep every record in one place.'],
    ],
    approach: ['A visit built around you', 'From the first hello, we listen before we examine. We check you carefully, explain what we find, and lay out simple next steps with honest guidance. You decide the pace. We handle the insurance paperwork, send reminders so nothing slips, and follow up after tests to make sure you understand your results and feel cared for.'],
    servicesIntro: 'Good health is more than the absence of illness; it is steady energy, peace of mind, and catching small issues before they become serious, costly ones. Our services span prevention, primary care, and chronic-condition management, so whatever brings you in, you are cared for in one welcoming practice by a team that already knows your history.',
    serviceLong: [
      'Annual physicals and wellness exams are the foundation of good health. We review your history, check your vital numbers, and screen for concerns before they grow, from blood pressure to blood sugar. You leave with a clear, plain-language picture of exactly where your health stands, a plan for staying well, and answers to every question you brought through the door.',
      'Preventive care and screenings catch issues early, when they are easiest to treat. We recommend age-appropriate checks and simple lab tests based on your history and risk, then explain what the results mean in terms you can act on. A little prevention now spares a lot of trouble later, and we make it straightforward and stress-free.',
      'Chronic conditions like diabetes, high blood pressure, and high cholesterol are far more manageable with steady, personal care. We track your numbers, adjust your plan as life changes, and coordinate the details so nothing falls through the cracks. Our goal is to help you feel your best and stay ahead of complications, with a partner who knows your whole story.',
      'Pediatric and adolescent care keeps kids and teens healthy as they grow. From well-child visits and growth checks to sick care and school forms, we cover it all, and we build trust early so your children feel at ease. Caring for the whole family in one place means fewer offices to juggle and one team who truly knows your kids.',
      'Immunizations and vaccines protect the whole family, from childhood shots to the annual flu vaccine and seasonal boosters. We keep your records current, explain what is recommended and why, and make each visit quick and comfortable. Staying up to date is one of the simplest, most powerful ways to guard your health and the health of those around you.',
      'Women’s health and wellness care meets you at every stage of life with comfort and respect. From well-woman visits and routine screenings to honest guidance on the questions that matter most, we make sure you feel heard and well cared for. You get thorough, personal attention from a team that treats your health as the priority it is.',
    ],
    why: [
      ['Same-day sick visits', 'Illness does not wait, so we do not make you wait either. We hold open slots each day for urgent visits, so you can be seen quickly by a team that already knows you.'],
      ['Most insurance accepted', 'We take the major plans and file the claims for you. We check your benefits before your visit, so the only surprise is how easy it was.'],
      ['A calm, modern practice', 'On-site labs, telehealth options, and a friendly team turn a stressful appointment into an easy one, even for patients who dread the doctor.'],
    ],
    contactIntro: 'Whether you are a new patient booking a first physical, a current patient with a question about a bill, or someone feeling unwell who needs to be seen today, we are glad you reached out. Fill out the form or call us directly and a friendly member of our front desk, not a machine, will help you find a time and answer anything you need before you arrive.',
    faqMore: [
      ['How often should I come in for a checkup?', 'For most healthy adults, once a year keeps you on track and catches problems early. If you are managing a condition or have specific risks, we may suggest more frequent visits. We will recommend a schedule that fits you, not a one-size-fits-all rule.'],
      ['Do you treat children, and at what age can they start?', 'Yes, we care for every age. We see newborns, kids, and teens for well-child visits, growth checks, and sick care. Caring for the whole family in one place means early, positive visits that help children feel at ease and set the stage for a lifetime of good habits.'],
      ['I have not seen a doctor in years. Will you judge me?', 'Never. Life gets busy and it is easy to fall behind on care. We meet you where you are, with zero lectures, and build a realistic plan to get your health back on track at a pace that feels comfortable for you.'],
      ['What should I do about an urgent problem after hours?', 'Call our main number and follow the prompts for urgent care. For chest pain, trouble breathing, or any life-threatening emergency, call your local emergency number first. For most concerns, we will get you seen the same day or first thing the next morning.'],
    ],
  },
  dental: {
    aboutP34: [
      'What sets us apart is the time we take. We never rush you out the door or push treatment you do not need. Instead, we walk you through every finding on the screen, answer questions in plain language, and build a plan around your priorities, your comfort, and your budget. Many of our patients have been with us for a decade or more, and their children now sit in the same chairs.',
      'Behind the warm welcome is a genuinely modern practice. Digital X-rays cut radiation and show you exactly what we see. Intraoral cameras turn "trust me" into "look here." Quieter tools and gentle numbing keep visits calm, and online booking with automatic reminders means you spend less time on the phone and more time smiling.',
    ],
    values: [
      ['Comfort without compromise', 'Sedation options, gentle technique, and a team that checks in often. If anything feels off, we stop and adjust. Your ease matters as much as your teeth.'],
      ['Honesty you can feel', 'We only recommend what we would choose for our own family. You get clear options, real costs, and the freedom to say not right now.'],
      ['Care for every age', 'Toddlers, teens, parents, and grandparents share one trusted office. We grow with your family and keep every history in one place.'],
    ],
    approach: ['A visit built around you', 'From the first hello, we listen before we look. We examine gently, explain what we find, and lay out simple choices with honest pricing. You decide the pace. We handle the insurance paperwork, send reminders so nothing slips, and follow up after bigger treatments to make sure you heal comfortably.'],
    servicesIntro: 'Great oral health is more than a bright smile; it is comfortable chewing, fresh breath, and catching small issues before they become painful, costly ones. Our services span prevention, restoration, and cosmetics, so whatever brings you in, you are cared for under one roof by a team that already knows your history.',
    serviceLong: [
      'Routine cleanings and exams are the foundation of a healthy mouth. We remove plaque and tartar the toothbrush cannot reach, screen for cavities and gum disease, and check for early signs of bigger problems, from grinding to oral cancer. You leave with a clean, polished smile and a plain-language summary of exactly where your health stands and what, if anything, to watch.',
      'When a tooth is damaged or decayed, we restore it with tooth-colored fillings and durable crowns that blend right in. Most are completed in one or two comfortable visits. We match the shade to your natural teeth, check your bite so nothing feels high, and protect the tooth so you can eat and smile without a second thought.',
      'Professional whitening lifts years of coffee, tea, and wine stains far beyond what store strips achieve. We protect your gums, brighten safely in the chair, and send you home with custom trays to keep the results fresh. It is one of the simplest, most satisfying ways to feel more confident about your smile.',
      'Clear aligners straighten teeth discreetly, with no metal brackets and no food restrictions. We map your entire plan before you start, so you can preview the finished result and know the timeline up front. Removable trays make brushing easy and let you eat what you love throughout treatment.',
      'Dental implants are the gold standard for replacing missing teeth. Anchored securely in the jaw, they restore full chewing power and a natural look that does not slip or click. We plan each case carefully with 3D imaging and guide you through every step, from placement to the final, lifelike crown.',
      'Dental emergencies never happen at a convenient time. A cracked tooth, sudden swelling, or throbbing pain deserves fast attention, so we hold same-day slots for urgent visits. Call us and we will get you seen, ease the pain, and lay out a clear plan to fix the problem for good.',
    ],
    why: [
      ['Same-day emergency care', 'Pain, chips, and swelling do not wait, so we do not make you wait either. Reserved daily slots mean fast relief from a team that already knows you.'],
      ['Most insurance accepted', 'We take the major plans and file the claims for you. You see your estimate before we begin, so the only surprise is how easy it was.'],
      ['A calm, modern office', 'Quiet tools, gentle numbing, and a friendly team turn a dreaded chore into an easy appointment, even for the most nervous patients.'],
    ],
    contactIntro: 'Whether you are a new patient booking a first cleaning, a current patient with a question about a bill, or someone in pain who needs to be seen today, we are glad you reached out. Fill out the form or call us directly and a friendly member of our front desk, not a machine, will help you find a time and answer anything you need before you arrive.',
    faqMore: [
      ['How often should I come in for a checkup?', 'For most people, twice a year keeps teeth clean and catches problems early. If you are prone to cavities or gum issues, we may suggest more frequent visits. We will recommend a schedule that fits your mouth, not a one-size-fits-all rule.'],
      ['Do you treat children, and at what age should they start?', 'Yes, we care for every age. We recommend a first visit for little ones around their first birthday or when the first tooth appears. Early, positive visits help kids feel at ease and set the stage for a lifetime of healthy habits.'],
      ['I have not been to a dentist in years. Will you judge me?', 'Never. Life gets busy and dental anxiety is common. We meet you where you are, with zero lectures, and build a gentle, realistic plan to get your smile back on track at a pace that feels comfortable for you.'],
      ['What can I do about a dental emergency after hours?', 'Call our main number and follow the prompts for urgent care. For severe swelling, trouble breathing, or trauma, seek emergency medical help first. For most dental emergencies, we will get you seen the same day or first thing the next morning.'],
    ],
  },
  wellness: {
    aboutP34: [
      'Over the years, this studio has become far more than a room with mats. It is where beginners discover they are stronger than they thought, where busy parents steal an hour of quiet, and where lifelong practitioners keep growing. We have kept classes small on purpose, so every teacher can offer real attention and every student feels seen, not lost in a crowd.',
      'Everything here is designed to help you exhale the moment you arrive: soft light, clean floors, a calm scent, and props already set out for you. We believe wellness should feel welcoming, not intimidating, so we leave the ego and the mirrors at the door and focus on how you feel, not how you look.',
    ],
    values: [
      ['Every body belongs', 'No flexibility required, no experience needed. Our teachers offer options for every pose so you can practice safely and proudly, exactly as you are today.'],
      ['Presence over performance', 'This is not a competition. We measure a good class by how grounded you feel walking out, not by how deep you fold or how long you hold.'],
      ['Community that lifts', 'You will learn names, make friends, and feel genuinely missed when you skip a week. A steady practice is easier when people are cheering you on.'],
    ],
    approach: ['How a class flows', 'Reserve your mat online in under a minute and arrive whenever suits you; we have props and mats ready. Your teacher greets you, learns any injuries or goals, and guides a class that meets the room where it is. You move at your own pace, rest whenever you need, and leave lighter than you came, week after week.'],
    servicesIntro: 'A good practice meets you where you are on any given day, whether you crave a strong sweat, a slow stretch, or a quiet mind. Our classes span the full range, taught by certified instructors who adjust for every level, so you can build strength, ease stress, and find calm without ever feeling out of place.',
    serviceLong: [
      'Vinyasa flow links breath to movement in a smooth, energizing sequence that builds heat, strength, and focus. Expect to move, sweat a little, and leave clear-headed. Teachers cue options throughout, so newcomers can take it gently while seasoned students challenge their balance and stamina. It is a favorite for anyone who likes their calm with a side of energy.',
      'Gentle and restorative classes are a soft landing for a hard week. Supported by bolsters and blankets, you settle into slow, deeply relaxing poses held long enough to release real tension. The nervous system quiets, the mind unwinds, and you leave feeling restored. No experience or flexibility needed, just a willingness to slow down.',
      'Power yoga is a stronger, faster practice that builds serious heat and stamina. It is athletic and invigorating, yet every pose has a modification, so you set the intensity. If you want a workout that also steadies your mind, this class delivers strength, sweat, and a satisfying sense of accomplishment.',
      'Meditation and breathwork sessions teach simple, practical tools to steady your breath and quiet a racing mind. No incense-and-mystery required, just clear guidance you can carry into a stressful commute or a sleepless night. Even ten minutes can shift your whole day, and beginners are especially welcome here.',
      'Pilates and core classes build a strong, stable center with low-impact, precise movement. Better posture, less back strain, and real functional strength are the payoff. It pairs beautifully with any yoga practice and suits every level, from first-timers to athletes looking to shore up their foundation.',
      'Private sessions offer one-on-one guidance tailored entirely to you. Whether you are working around an injury, preparing for an event, or simply want focused attention, your instructor designs each session around your body, goals, and pace. It is the fastest way to build confidence, deepen your understanding, and refine your practice, and it is a wonderful complement to group classes whenever you want a little extra care.',
    ],
    why: [
      ['Your first class is on us', 'Try the studio with zero risk. Meet a teacher, feel the space, and see how good it feels to slow down before you commit to anything.'],
      ['Certified, caring instructors', 'Every teacher is trained to guide you safely and adjust for your body, so you can push a little or rest a lot with total confidence.'],
      ['Schedules that fit real life', 'Morning, midday, and evening classes mean you can practice around work and family, not the other way around.'],
    ],
    contactIntro: 'New to the studio and not sure where to start? Curious about memberships, or want to book a private session? We would love to hear from you. Send a message or give us a call and a real person from our team will help you find the right class, answer any questions, and make your very first visit feel easy and welcoming.',
    faqMore: [
      ['I am not flexible at all. Can I still do yoga?', 'Absolutely, and you are exactly who yoga helps most. Flexibility is a result of practice, not a requirement to begin. Our teachers offer props and easy options for every pose, so you build strength and range safely, at your own pace.'],
      ['How often should I practice to see benefits?', 'Even one class a week makes a real difference in how you feel. Two or three builds noticeable strength and calm. We suggest starting with what is realistic for your schedule; consistency matters far more than intensity when it comes to lasting benefits.'],
      ['What is the difference between your class styles?', 'Flow and power classes build heat and strength; restorative and gentle classes release tension and calm the mind; meditation steadies your breath; Pilates strengthens your core. Not sure which fits? Tell us how you want to feel and we will point you to the right class.'],
      ['Do I need to buy a membership to attend?', 'Not at all. We offer drop-ins and class packs alongside monthly memberships, so you can practice entirely on your own terms. Start with a single class, and choose a plan later only if the studio becomes part of your routine.'],
    ],
  },
  fitness: {
    aboutP34: [
      'Over the years, this gym has become far more than a room full of iron. It is where nervous first-timers discover they are stronger than they thought, where busy people carve out an hour to feel powerful, and where seasoned lifters keep chasing new numbers. We keep our coaching hands-on and our crew tight, so every member gets real attention instead of getting lost in a crowd.',
      'Everything here is built to help you train well: quality barbells, plenty of racks and platforms, and coaches who actually watch your lifts. We believe strength should feel welcoming, not intimidating, so we leave the ego at the door and focus on your progress. You bring the effort, we bring the plan, and together we build something you can measure.',
    ],
    values: [
      ['Everyone belongs here', 'No experience required and no judgment allowed. Our coaches scale every lift to your level, so you train safely and proudly, exactly where you are today.'],
      ['Technique before ego', 'We care how you move, not just how much you lift. Good form comes first, because it keeps you healthy and lets your strength climb for years.'],
      ['A crew that shows up', 'You will learn names, spot each other, and get genuinely missed when you skip a week. Hard training is easier when the people around you push you.'],
    ],
    approach: ['How training works here', 'Book your free first session online in under a minute and arrive ready to move. A coach greets you, learns your goals and any injuries, and guides a session built for your level. You lift at your own pace, add weight when you are ready, and leave stronger and more confident, session after session, with a clear plan for what comes next.'],
    servicesIntro: 'Good training meets you where you are, whether you want to learn the barbell lifts, chase a bigger total, or simply feel strong in everyday life. Our programs span the full range, coached by certified pros who scale every movement to your level, so you build real strength, move better, and make steady progress without ever feeling out of place.',
    serviceLong: [
      'Strength and barbell training teaches the squat, bench, and deadlift with hands-on coaching that builds a confident, capable base. You start at a weight that fits you and add load as your technique sharpens, so progress feels earned and safe. It is the fastest way to get genuinely strong, and it pays off in everything else you do, in the gym and out.',
      'Personal training is one-on-one coaching built entirely around you. Your coach learns your goals, writes a plan for your body and schedule, and holds you accountable session after session. Whether you are recovering from a long break, chasing a specific number, or just want expert eyes on every rep, this is the most direct path to results, tailored start to finish.',
      'Small-group classes mix strength and conditioning into a coached, energetic hour that never feels like a crowd. Because the groups stay small, you get real form checks and personal attention, plus a crew that pushes you a little harder than you would push yourself. It is the sweet spot between a solo program and a big, impersonal class.',
      'Powerlifting and Olympic lifting coaching is for anyone who wants to chase a bigger total or clean up their technique on the platform. First-time competitors and seasoned lifters alike get focused programming, sharp cues, and a plan that peaks you for the day that matters. You will train smart, lift heavy, and know exactly what to do under the bar.',
      'Mobility and recovery work keeps you training pain-free for the long haul. Guided warm-ups, targeted mobility drills, and recovery sessions help you move better, feel looser, and bounce back faster between hard days. Strength lasts only if your body does, so we treat recovery as part of the program, not an afterthought you squeeze in when something hurts.',
      'Membership gives you full access to the gym, open-gym hours, and a community that shows up. Simple month-to-month plans mean no long contracts and no games, just a great place to train whenever it fits your life. You get the equipment, the space, and the people, all built around helping you keep getting stronger on your own schedule.',
    ],
    why: [
      ['Your first session is on us', 'Try the gym with zero risk. Meet the coaches, feel the room, and see how real training feels before you commit to anything at all.'],
      ['Certified, hands-on coaches', 'Every coach is trained to teach the lifts and keep you safe, so you can push hard or ease in with total confidence in your technique.'],
      ['Plans that fit real life', 'Early, midday, and evening hours plus flexible memberships mean you train around work and family, not the other way around.'],
    ],
    contactIntro: 'New to lifting and not sure where to start? Curious about memberships, or want to book a personal training session? We would love to hear from you. Send a message or give us a call and a real member of our team will help you pick the right program, answer any questions, and make your very first session feel easy and welcoming.',
    faqMore: [
      ['I have never lifted before. Can I still join?', 'Absolutely, and you are exactly who we love to coach. We teach the lifts from the ground up, with hands-on guidance and weights scaled to you. You build good technique and real confidence from your very first session, at a pace that feels right for your body.'],
      ['How often should I train to see results?', 'Even two sessions a week makes a real difference in how you feel and how you move. Three builds noticeable strength. We suggest starting with what is realistic for your schedule; consistency matters far more than intensity when it comes to lasting progress, and your coach will help you find the right frequency.'],
      ['What is the difference between your programs?', 'Personal training is one-on-one and fully tailored; small-group classes mix strength and conditioning with a crew; barbell training focuses on the core lifts; powerlifting and Olympic coaching peak you for the platform. Not sure which fits? Tell us your goals and we will point you to the right starting place.'],
      ['Do I need a membership to train here?', 'Not necessarily. We offer drop-ins and class packs alongside month-to-month memberships, so you can train entirely on your own terms. Start with a single session, and choose a plan later only if the gym becomes part of your routine. There is no pressure and no long contract.'],
    ],
  },
  legal: {
    aboutP34: [
      'Legal problems rarely arrive alone; they come tangled with stress, uncertainty, and a lot at stake. Our firm was built to be the steady hand in those moments. We take time to understand not just the facts of your case but what matters most to you, then we chart a clear path and walk it beside you, keeping you informed at every turn.',
      'We have handled hundreds of matters for families and businesses in this community, and that experience shows in the details: anticipating the other side’s moves, spotting risks early, and knowing when to negotiate and when to stand firm. You will always work directly with a senior attorney who knows your case, returns your calls, and treats your matter with the seriousness it deserves.',
    ],
    values: [
      ['Plain-language counsel', 'The law is full of jargon; your lawyer should not be. We explain your options in clear terms so you can make confident, informed decisions about your own future.'],
      ['Senior attention, always', 'Your case is handled by an experienced attorney, never quietly passed to a junior associate. The person you meet is the person who does the work.'],
      ['Discretion by default', 'Your matter stays private. We handle sensitive situations with the care, confidentiality, and respect you would expect for your own family.'],
    ],
    approach: ['What working with us looks like', 'It starts with a free, confidential consultation where we listen and give you an honest read on your options. If we move forward, we map a clear strategy, explain the likely timeline and costs, and handle the filings, negotiations, and hard conversations. Throughout, we keep you updated in real time, so you are never left guessing about what happens next.'],
    servicesIntro: 'When life or business takes an unexpected turn, the right counsel makes all the difference. Our attorneys bring focused experience across the matters people face most, from protecting a family through divorce to closing a real estate deal to pursuing fair compensation after an injury. Whatever your situation, you get straight advice and a determined advocate in your corner.',
    serviceLong: [
      'Family law matters, from divorce and custody to child and spousal support, are among the most personal a person can face. We handle them with discretion, compassion, and a firm focus on protecting what matters most to you: your children, your finances, and your peace of mind. Where we can resolve things amicably we will, and where we must fight, we fight hard.',
      'Thoughtful estate planning spares your loved ones confusion and conflict during an already painful time. We prepare wills, trusts, and powers of attorney tailored to your wishes, so your assets pass exactly the way you intend and your family has clear guidance. It is one of the most caring things you can do for the people you love.',
      'If you were hurt because of someone else’s carelessness, you deserve full and fair compensation for your medical bills, lost income, and pain. We handle personal injury cases on a contingency basis, meaning no fee unless we win. We deal with the insurance companies so you can focus on healing, not haggling.',
      'Businesses need sound legal footing to grow with confidence. We handle formation, contracts, and disputes so you can run your company without nasty surprises. From a solid operating agreement to a tough negotiation, we protect your interests and translate legal risk into clear, practical decisions you can actually act on.',
      'Real estate transactions involve large sums and dense paperwork where small errors get expensive. We guide buyers, sellers, and owners through clear contracts and smooth closings, catching issues before they become problems. Whether it is your first home or a commercial deal, you get careful review and confident guidance start to finish.',
      'Probate and the settling of an estate can feel overwhelming while you are grieving. We guide executors and families through the process with patience and clarity, handling the court requirements, creditor claims, and distributions so you can focus on what matters. Our goal is to lighten the load and honor the wishes of your loved one faithfully.',
    ],
    why: [
      ['Free, honest consultation', 'Come in, tell us your situation, and get a clear read on your options with no obligation. You will leave knowing where you stand, whether or not you hire us.'],
      ['Fees explained up front', 'Flat fee, contingency, or hourly, you know the structure before you sign. No surprise bills, no meter running on every phone call.'],
      ['A record clients rely on', 'Decades of combined experience and hundreds of resolved matters mean you get seasoned judgment, not on-the-job training, when the stakes are high.'],
    ],
    contactIntro: 'The hardest part is often just reaching out. Whether you are facing a difficult family matter, planning for the future, or dealing with an injury or dispute, we are here to help and there is no cost to talk. Send us a message or call to schedule your free, confidential consultation, and a member of our team will get back to you promptly with clear next steps.',
    faqMore: [
      ['Do I really need a lawyer for this, or can I handle it myself?', 'Some matters are simple enough to handle alone; many are not, and mistakes can be costly or permanent. The honest answer depends on your situation. Come in for a free consultation and we will tell you plainly whether you need us, even if the answer is no.'],
      ['How long does a typical case take to resolve?', 'It varies widely by matter and complexity. A straightforward will might take days; a contested case can take months. What we promise is a realistic timeline early on and regular updates, so you are never left wondering where things stand or what comes next.'],
      ['What should I bring to my first consultation?', 'Bring any documents related to your matter: contracts, letters, court papers, or notes on what happened and when. Do not worry if you are missing something; just bring what you have. The more we can review, the more specific our guidance can be from the very first meeting.'],
      ['Will everything I tell you stay confidential?', 'Yes. Attorney-client privilege protects your communications from the moment you consult us, even if you decide not to hire the firm. You can speak freely and completely, knowing your private matters remain private and are handled with the utmost discretion.'],
    ],
  },
  restaurant: {
    aboutP34: [
      'Everything starts in the kitchen, where our cooks show up early to prep from scratch: stocks simmering, bread proofing, sauces built by hand rather than poured from a jar. We source from nearby farms and makers we actually know, so the menu shifts with the seasons and the flavors taste like they came from somewhere, because they did.',
      'Out front, we want the room to feel like the best kind of gathering: warm light, easy conversation, and a team that remembers your name and your usual. Whether it is a quiet dinner for two, a boisterous family celebration, or a solo seat at the bar, you are family the moment you walk in, and we treat every plate like it is going to someone we love.',
    ],
    values: [
      ['Made from scratch, daily', 'From the sauces to the desserts, we cook it here, by hand, every day. No shortcuts, no freezer-to-fryer, just real food that tastes like someone cared.'],
      ['Local and seasonal', 'We buy from nearby farms and makers, so the menu changes with what is fresh. Better flavor, a smaller footprint, and a community we are proud to support.'],
      ['Everyone at the table', 'Vegetarian, gluten-free, or feeding a picky kid, we have got you. Tell us what you need and our kitchen will happily make it work.'],
    ],
    approach: ['From our kitchen to your table', 'Reserve online or by phone, or simply walk in and we will find you a seat when we can. Settle in, let our team guide you to the dishes we are most excited about today, and enjoy plates made fresh to order. Planning something bigger? Ask about catering and private events, and we will build a menu around your occasion.'],
    servicesIntro: 'Good food brings people together, and we take that seriously. From weekend brunch to a special dinner, from a crowd-pleasing catering spread to an intimate private event, everything we serve is made from scratch with local ingredients. Explore what is on the menu, and know that whatever the occasion, we are ready to make it delicious.',
    serviceLong: [
      'Our chef specials are where the kitchen gets to play. Each week we build a handful of seasonal plates around the best local finds, from just-picked produce to the day’s fresh catch. Ask your server what is new; these dishes change often and rarely last, so they are the perfect way to taste what our cooks are most excited about right now.',
      'Weekend brunch is a beloved ritual here, from fluffy pancakes and golden waffles to savory hash and eggs done just right, all with bottomless coffee to ease you into the day. It is relaxed, generous, and made for lingering, whether you are recovering from a big night or gathering the family for a slow, happy morning.',
      'Dinner is the heart of what we do: hearty mains, shareable plates, and flavors built from scratch to gather around. Whether you are here for a special occasion or a well-earned weeknight treat, there is something for every appetite, paired with a thoughtful drink list and served by a team that genuinely wants you to leave happy.',
      'Our catering brings the same fresh, made-to-order food to your event, delivered on time and ready to impress. From office lunches to birthday parties to holiday gatherings, we handle the menu, the quantities, and the details so you can focus on your guests. Tell us the crowd and the vibe, and we will build a spread everyone remembers.',
      'Host your celebration in our space and let us handle the rest. For private events we craft a menu built around your occasion, whether it is an anniversary dinner, a rehearsal, or a company milestone. You get a warm room, attentive service, and food worth gathering for, without any of the stress of hosting at home.',
      'Save room, because our desserts are made in house and worth it. Baked fresh daily, from rich classics to seasonal surprises, they are the sweet ending every great meal deserves. Ask about the day’s selection, or take one home; they have a way of turning an ordinary evening into a small celebration.',
    ],
    why: [
      ['A scratch kitchen', 'We cook everything in house, every day, from local ingredients. It takes more work, and you can taste the difference in every single bite.'],
      ['Reservations or walk-in', 'Book ahead online or just drop by; we welcome both. Planning a party? Ask about catering and private events and we will make it easy.'],
      ['Made for every guest', 'Vegetarian and gluten-free dishes are marked on the menu, and our kitchen happily accommodates allergies and preferences. Everyone leaves the table satisfied.'],
    ],
    contactIntro: 'Have a question about the menu, want to book a table, or planning a party or catered event? We would love to hear from you. Send a message or give us a call and a member of our team will help you sort out the details, from dietary needs to private dining, so your next meal with us is exactly what you hoped for.',
    faqMore: [
      ['Do you have options for kids and picky eaters?', 'We do. Alongside our regular menu, we are always happy to keep things simple for younger guests or anyone who prefers plainer plates. Just let your server know; our kitchen would much rather make something everyone enjoys than see a plate go back untouched.'],
      ['Can you accommodate large groups and celebrations?', 'Absolutely. We regularly host birthdays, anniversaries, and get-togethers, and we can arrange group menus or a private space depending on the size. Reach out ahead of time and we will help you plan the details so your gathering is relaxed and memorable.'],
      ['Do you offer takeout or delivery?', 'Yes, many of our dishes travel beautifully, and we package them with care so they arrive just right. Call to place an order or ask about the easiest way to get your favorites to go. Catering is also available for larger orders and events.'],
      ['Where do you source your ingredients?', 'We buy from local farms, makers, and suppliers whenever we can, which is why the menu shifts with the seasons. Fresher ingredients simply taste better, and supporting our neighbors keeps our community strong. Ask us what is in season and we will happily tell you the story behind the plate.'],
    ],
  },
  'local-service': {
    aboutP34: [
      'We started this company with a simple frustration: too many home services show up late, quote one price and charge another, and leave a mess behind. So we built the opposite. When you call, you reach people who arrive in the window we promise, quote the real price before we start, and treat your home with the respect we would want in our own.',
      'Every technician on our team is fully licensed, insured, and background-checked, and every job is backed by our workmanship guarantee. We invest in training and the right tools so we can diagnose honestly and fix it right the first time, whether it is a quick repair or a major upgrade. Do it well, do it once, and stand behind it; that is the whole philosophy.',
    ],
    values: [
      ['On time, as promised', 'We show up when we say we will and respect your schedule. No all-day windows, no waiting around, no wondering whether we are actually coming.'],
      ['One honest price', 'You approve the cost before we lift a tool, and that is the price you pay. No surprise add-ons, no upselling, no fine print at the bottom of the invoice.'],
      ['Respect for your home', 'We protect your floors, clean up when we finish, and leave your space better than we found it. Your home is not a job site to us; it is your home.'],
    ],
    approach: ['How we get your problem solved', 'Call or book online and tell us what is going on; we will schedule a visit fast, often the same day for urgent issues. We assess the situation, explain what we found in plain terms, and give you a clear, upfront price. Once you approve, we do the work cleanly and correctly, then back it in writing so you can relax knowing it is truly handled.'],
    servicesIntro: 'Your home is one of your biggest investments, and keeping it running smoothly should not be a gamble. From urgent repairs to planned upgrades and routine maintenance, our licensed team handles it all with honest pricing and quality that lasts. Whatever the job, big or small, you get dependable work from people who actually stand behind it.',
    serviceLong: [
      'When something breaks, you want it fixed fast and fixed right, not patched to fail again next month. Our technicians diagnose the real problem honestly, explain your options, and make lasting repairs with quality parts. We show up prepared, work cleanly, and back every fix with our guarantee, so a repair is one less thing on your mind, not a recurring headache.',
      'A proper installation is the difference between equipment that lasts for years and one that causes trouble from day one. We install new fixtures and systems to code, sized right for your home and built to last. We take the time to do it correctly, test everything before we leave, and make sure you know how it all works.',
      'Small problems are cheaper to prevent than to repair. Our maintenance plans keep your equipment tuned, catch wear before it becomes a breakdown, and extend the life of the systems you rely on. Scheduled visits mean fewer surprises, lower bills, and the peace of mind that comes from knowing everything is in good hands.',
      'When something fails after hours or on a weekend, you cannot always wait until Monday. We offer same-day and emergency service for the urgent problems that just cannot wait, arriving fast to get your home back to normal. One call and a real person answers, ready to help when you need it most.',
      'Modern upgrades do more than look good; they lower your bills and make your home more comfortable and efficient. We help you choose the right improvements for your budget and install them cleanly, so you start seeing the benefits right away. It is a smart investment that pays you back month after month.',
      'A thorough inspection tells you exactly where you stand, with no guesswork and no scare tactics. We check carefully, document what we find, and give you a clear report and honest recommendations. Whether you are buying a home, selling one, or just want peace of mind, you will know the real condition and what, if anything, needs attention.',
    ],
    why: [
      ['Licensed and insured', 'Fully credentialed, background-checked pros protect your home and your peace of mind on every single job. Your investment is safe with us.'],
      ['Free, upfront quotes', 'Know the price before any work begins, with no obligation and no pressure. What we quote is what you pay, every time.'],
      ['Guaranteed workmanship', 'If it is not right, we make it right, no argument. Every job is backed in writing, because we stand behind our work completely.'],
    ],
    contactIntro: 'Got a problem that needs fixing, a project in mind, or just want a straight answer and a fair quote? Reach out. Send us a message or give us a call, and a real person, not an answering service, will help you get scheduled. For urgent issues, ask about same-day service; we keep slots open for the problems that simply cannot wait.',
    faqMore: [
      ['How quickly can you come out for an urgent problem?', 'For genuine emergencies, we aim for same-day service and keep slots open specifically for urgent calls. When you call, tell us what is happening and how bad it is, and we will give you a realistic arrival time and, when possible, tips to limit any damage until we get there.'],
      ['Do you charge for a quote or estimate?', 'No. We provide a clear, no-obligation quote before any work begins, so you can make an informed decision with zero pressure. You will know the full scope and the real price up front, and the choice to move forward is always entirely yours.'],
      ['What happens if something goes wrong after the work is done?', 'Just call us. Every job is backed by our workmanship guarantee, so if something is not right, we come back and fix it, no argument and no extra charge for our workmanship. Standing behind our work is not a marketing line; it is how we keep your trust.'],
      ['What areas do you serve?', 'We proudly serve our local community and the surrounding neighborhoods. If you are not sure whether you are in our service area, just give us a call with your address and we will confirm right away, along with the soonest time we could get to you.'],
    ],
  },
  nonprofit: {
    aboutP34: [
      'What began as a handful of neighbors helping neighbors has grown into a mission that reaches families across our community every week. The need is real and it is local, and so is every ounce of the response. Your support does not disappear into a distant headquarters; it stays right here, turning into meals, mentoring, and a helping hand for people who live down the street.',
      'We are powered by volunteers and guided by careful, transparent stewardship, which means the large majority of every gift goes straight to the people we serve. We publish our impact openly and welcome your questions, because trust is earned. When you give or volunteer with us, you are not a line item; you are part of a community choosing to show up for one another.',
    ],
    values: [
      ['Local impact you can see', 'Every dollar and every hour stays in our community and helps neighbors who need it most. This is not charity from afar; it is change you can watch happen.'],
      ['Honest stewardship', 'We publish where funds go and welcome your questions. The large majority of every gift funds programs directly, and we are proud to show exactly how.'],
      ['Powered by people', 'Caring volunteers, not overhead, drive the work. When you give your time or your gift, you join a real community making a real difference together.'],
    ],
    approach: ['How your support becomes impact', 'It is simple: you give or you volunteer, and that support joins the efforts of others to fund real programs. Volunteers turn dollars into hands-on help, meals into full plates, and good intentions into lasting change for our neighbors. We track our results carefully and share them openly, so you can see the difference your generosity makes, week after week.'],
    servicesIntro: 'Real change happens through practical, caring work that meets people where they are. Our programs address the needs we see most in our community, from food and essentials to youth mentoring to emergency support in a crisis. Explore the work your gifts and volunteer hours make possible, and see how much a community can do when it decides to show up.',
    serviceLong: [
      'No one in our community should go hungry or without basic necessities. Our food and essentials program provides meals, groceries, and everyday items to families facing hard times, always with dignity and warmth. We meet immediate needs today while connecting people with the resources to find steadier ground tomorrow, treating everyone who comes to us as the neighbor they are.',
      'Every young person deserves a safe place to grow, learn, and be encouraged. Our youth programs offer mentoring, enrichment, and a caring community that helps kids build confidence and reach their potential. By investing in young people now, with steady adults and real opportunities, we help write a brighter future for them and for the whole community.',
      'We go where the need is, meeting people where they are and connecting them with the help they need. Our community outreach builds relationships, breaks down barriers, and ensures that support reaches those who might otherwise fall through the cracks. Sometimes the most powerful thing we offer is simply showing up, consistently, with open hands and open hearts.',
      'When crisis strikes, families need help fast. Our emergency support provides swift assistance to neighbors facing a sudden setback, whether it is a lost job, an unexpected bill, or a disaster. We move quickly and compassionately to stabilize the situation, so a temporary hardship does not become a lasting one for the people we serve.',
      'Our work runs on the generosity of volunteers, and there is a place for everyone. Whether you have an hour or a whole day, specialized skills or simply a willing heart, we will match you with a role that fits. Volunteering is hands-on, deeply rewarding, and the surest way to see your impact firsthand, right alongside neighbors who care as much as you do.',
      'Lasting change requires more than direct service; it requires awareness and voice. Through education and advocacy, we raise understanding of the challenges our neighbors face and speak up for the people we serve. By shining a light on real needs and real solutions, we help build a community that cares for all of its members, not just some.',
    ],
    why: [
      ['Every gift matters', 'Large or small, every donation moves the mission forward. You do not need deep pockets to change a life for the better right here at home.'],
      ['Volunteers always welcome', 'Whatever your schedule or skills, there is a meaningful way to help. Roll up your sleeves and see your impact firsthand, alongside a caring community.'],
      ['Transparent by design', 'We share our impact and our finances openly, so you can give with full confidence that your support truly reaches the people who need it.'],
    ],
    contactIntro: 'Want to get involved, ask about our programs, or explore how your business or group can partner with us? We would be glad to hear from you. Send a message or give us a call, and a member of our team will follow up personally. Whether you are hoping to give, volunteer, or simply learn more, there is a place for you here.',
    faqMore: [
      ['How do I know my donation is making a real difference?', 'We publish our impact and finances openly, and the large majority of every gift funds programs directly. Beyond the numbers, we share stories and results so you can see the meals served, the students mentored, and the families helped. Your generosity does not disappear; it shows up in our community every week.'],
      ['Can I volunteer if I only have a little time?', 'Yes, and every hour counts. We have opportunities that fit almost any schedule, from one-time events to occasional shifts to ongoing roles. Tell us how much time you have and what you enjoy, and we will match you with a way to help that feels genuinely worthwhile.'],
      ['Do you offer ways for kids and families to get involved?', 'We do. Volunteering together is a wonderful way for families to give back and for children to learn the value of service. We can suggest age-appropriate, family-friendly ways to help, so everyone from grandparents to grade-schoolers can be part of the work.'],
      ['How can my company support your mission?', 'We partner with local businesses on giving, sponsorships, matching gifts, and team volunteer days. Corporate support goes a long way, and it is a meaningful way to engage your employees in the community. Reach out and we will find a partnership that fits the values and goals of your company.'],
    ],
  },
  retail: {
    aboutP34: [
      'We got into this because we were tired of buying things that fell apart, from flimsy goods to inflated prices to service that treated us like an order number. So we built the shop we wished existed: a tightly curated selection of products that actually last, chosen by people who use them, at prices that are simply fair. No gimmicks, no clutter, no pressure.',
      'Every item on our shelves has earned its place. We test what we sell, we talk to the makers, and we skip anything we would not recommend to a friend. When you shop with us, you get honest guidance, fast and free shipping on qualifying orders, and returns so easy you can buy with total confidence. Your trust matters far more to us than any single sale.',
    ],
    values: [
      ['Quality over quantity', 'We stock fewer things, chosen better. Every product earns its spot by being genuinely good, durable, and worth your money, so you can buy with confidence.'],
      ['Honest, fair prices', 'No inflated tags marked down to look like deals. Just fair prices on things you actually want, with no gimmicks and no games at checkout.'],
      ['Service like a person', 'Real recommendations from a team that uses what we sell, plus easy returns if it is not right. You are a person to us, never an order number.'],
    ],
    approach: ['A better way to shop', 'Browse our curated collections, chosen for quality rather than clutter. Every product page gives you honest details, so you know exactly what you are getting. Check out fast and secure, and enjoy free shipping on qualifying orders. If anything is not quite right, our easy 30-day returns make it painless. Love it or send it back; no hassle either way.'],
    servicesIntro: 'Shopping should be simple and satisfying, not a gamble on quality or a battle at checkout. Our collections are curated with care, from fresh arrivals to proven best sellers to everyday essentials, all backed by fast, free shipping and easy returns. Whatever you are looking for, you will find goods worth owning and a team happy to help you choose.',
    serviceLong: [
      'Our new arrivals are the latest pieces to hit the shelves, hand-picked for quality and freshly stocked. Be the first to grab the drop before it sells out. We are always hunting for goods that meet our standards, so checking in on what is new is the best way to discover your next favorite thing before everyone else does.',
      'Our best sellers have earned their status the honest way: customers keep coming back for them. Proven, popular, and reliably good, these are the pieces we recommend when you want a sure thing. If you are not sure where to start, start here, with the goods our community has already put to the test and loved.',
      'Everyday essentials are the staples that never let you down, the reliable basics you reach for again and again. We stock the versions done right, built to last and priced fairly, so you can stock up with confidence. These are the quiet workhorses of a well-chosen collection, and getting them right makes all the difference.',
      'Our seasonal picks are chosen for the moment, here for a limited time to match what you need right now. Whether it is a warm-weather must-have or a cold-season comfort, these curated pieces capture the season at its best. When they are gone, they are gone, so grab what catches your eye while it lasts.',
      'Stuck on what to give? Our gifts collection gathers thoughtful, crowd-pleasing finds for everyone on your list, ready to give and sure to delight. From the person who has everything to the one who is impossible to shop for, we have picked options that feel personal and land well, taking the stress out of gifting.',
      'Great gear at even better prices, our sale section is where quality meets a bargain. These are real products at genuinely reduced prices, not clearance junk, available while supplies last. It is the perfect place to try something new or stock up on a favorite, so check back often; the best deals do not stick around.',
    ],
    why: [
      ['Free shipping over the threshold', 'Qualifying orders ship free and arrive fast, with tracking every step of the way. Smaller orders ship at a flat, fair rate you see before checkout.'],
      ['Easy 30-day returns', 'Changed your mind? Send it back within 30 days for a refund or exchange, no hassle and no hard questions. Shop with total confidence.'],
      ['Quality you can trust', 'We use what we sell and only stock what we would recommend to a friend. Every product is chosen to last and backed by our guarantee.'],
    ],
    contactIntro: 'Question about an order, need a recommendation, or wondering when something will be back in stock? We are happy to help. Send us a message or reach out anytime, and a real member of our team, not a bot, will get back to you quickly. We want you to love what you buy, and we are here to make shopping with us easy from cart to doorstep.',
    faqMore: [
      ['How do I choose the right product if I am not sure?', 'Start with our best sellers, which are proven favorites, or reach out and tell us what you are looking for. Our team actually uses what we sell, so we can give you honest, specific recommendations rather than a generic sales pitch. We would rather help you buy the right thing once than the wrong thing twice.'],
      ['Can I change or cancel my order after I place it?', 'If your order has not shipped yet, we can usually help you change or cancel it, so reach out as soon as possible. Once it is on its way, our easy 30-day returns have you covered, so you are never stuck with something that is not right for you.'],
      ['Do you offer gift cards or gift wrapping?', 'We do offer gift cards, which make a great choice when you are not sure what someone would like. Ask us about gift options and wrapping when you order, and we will help make your gift feel special and land well with whoever is lucky enough to receive it.'],
      ['What if my item arrives damaged?', 'We are sorry, and we will make it right quickly. Reach out with your order details and a photo if you can, and we will arrange a replacement or refund right away. We pack orders with care to prevent this, but when it happens, sorting it out fast is our job, not yours.'],
    ],
  },
  saas: {
    aboutP34: [
      'We built this platform because we were drowning in the same busywork you are: the copy-paste between tools, the manual status updates, the reports nobody had time to run. So we made software that quietly handles the tedious parts, freeing teams to spend their energy on the work that actually moves the business forward. Less clicking, more shipping; that has been the goal from day one.',
      'From your first user to your millionth, the platform stays fast, secure, and genuinely simple to use. We are honest about pricing, quick to help when you get stuck, and relentlessly focused on saving you time rather than adding another dashboard to babysit. Great software should feel like a reliable teammate who never drops the ball, not one more chore on the pile.',
    ],
    values: [
      ['Time is the point', 'Every feature earns its place by saving you effort. We automate the work you never wanted to do by hand, so your team can focus on what actually matters.'],
      ['Secure and steady', 'Encryption, access controls, and audit logs come standard, and performance holds as you grow. You get enterprise-grade reliability without the enterprise-grade headache.'],
      ['Honest and human', 'Clear pricing with no hidden fees, and real people who answer fast when you need help. No phone trees, no canned replies, no surprises on the invoice.'],
    ],
    approach: ['From sign-up to shipping', 'Getting started takes minutes, not weeks. Create your account free with no credit card, connect the tools you already use in a few clicks, and set up automated flows that run the busywork for you. From there, watch your team move faster with less friction, and lean on real human support whenever you need a hand along the way.'],
    servicesIntro: 'Everything you need to move faster lives in one place. From automating repetitive tasks to keeping your team aligned to surfacing the numbers that matter, the platform replaces scattered tools and manual effort with reliable, connected workflows. Explore what you can do, and picture the hours your team gets back every single week.',
    serviceLong: [
      'Workflow automation turns the manual, repetitive tasks that eat your week into reliable flows that just run. No code required; you set the rules once and the platform handles the rest, from routing requests to updating records to triggering the next step. Teams routinely save hours a week, and those hours go straight back into the work that actually matters.',
      'Team collaboration keeps everyone aligned without the endless status meetings. Shared views, inline comments, and real-time updates mean your whole team sees the same picture and moves in the same direction. No more digging through inboxes or wondering who is doing what; the work, and the context around it, lives in one clear, always-current place.',
      'Analytics and reporting turn your data into decisions anyone can act on. Clean dashboards surface the numbers that matter in plain terms, so you spend time acting on insights instead of assembling spreadsheets. Whether it is a quick pulse check or a deep dive, the answers are a glance away, and they are answers your whole team can actually read.',
      'Integrations connect the tools you already rely on, so your data flows in one direction: forward. Instead of copy-pasting between apps, let the platform sync everything automatically and keep it in step. Your existing stack keeps working, only smoother, with fewer gaps, fewer errors, and a lot less tedious manual upkeep across the board.',
      'Access controls give the right people the right access, and no more. With roles and granular permissions, you decide who can see and do what, keeping sensitive work secure without slowing anyone down. It scales cleanly as your team grows, so onboarding a new hire or a whole department is a matter of a few clicks, not a security scramble.',
      'Our API and webhooks let you build on top of the platform however you need. Clean, well-documented endpoints mean your developers can extend, integrate, and automate with confidence, wiring the platform into your own systems and workflows. Whatever you want to build, the foundation is solid, predictable, and ready for you to grow on.',
    ],
    why: [
      ['Free 14-day trial', 'Try everything with no credit card and no risk. Explore the full platform, invite your team, and see the time savings before you ever pay a cent.'],
      ['Live in minutes', 'Most teams are up and running the same day. Connect your tools, set up your first flows, and start replacing busywork right away, no lengthy onboarding required.'],
      ['Support that responds', 'Real humans answer fast by chat or email, with no phone trees and no canned scripts. When you need a hand, you get one, quickly.'],
    ],
    contactIntro: 'Curious whether the platform fits your team, want a guided demo, or have a question about pricing or security? We are happy to help. Send a message or reach out and a real member of our team will get back to you fast, no pushy sales tactics. Or skip ahead and start your free trial; there is no credit card required and nothing to lose.',
    faqMore: [
      ['Will this work with the tools we already use?', 'Very likely, yes. The platform integrates with the common tools most teams rely on, syncing your data automatically so nothing has to be rekeyed. Tell us your stack and we will confirm the fit, and our clean API means anything not supported out of the box can usually be connected with a little setup.'],
      ['How hard is it to get my team on board?', 'Not hard at all; that is by design. Setup takes minutes, the interface is genuinely intuitive, and roles and permissions make onboarding new people quick. Most teams find that once colleagues see the busywork disappear, adoption takes care of itself. And if anyone gets stuck, our support team is fast and friendly.'],
      ['Is my data safe with you?', 'Security is built in, not bolted on. Encryption, access controls, and audit logs come standard on every plan, and we hold performance and reliability to a high bar as you grow. Your data is protected, your access is yours to control, and we are transparent about how it all works.'],
      ['What if I outgrow my plan, or need to scale back?', 'You are never locked in. Upgrade, downgrade, or cancel anytime as your needs change; the platform scales smoothly from a small team to a large one and back. We would rather earn your business every month than trap you in a contract, so you always stay in control of your plan.'],
    ],
  },
  'real-estate': {
    aboutP34: [
      'What sets us apart is the time we take. We never rush you toward a home that is not right or a price that does not add up. Instead, we tour honestly, point out the good and the bad, and back every number with recent local sales. Many of our clients come from referrals, and plenty come back to us for their next move, because they trusted the guidance the first time.',
      'Behind the friendly approach is real local expertise. We track neighborhood prices, days on market, and the small details that make one street more valuable than the next. That means sharper pricing when you sell, smarter offers when you buy, and a steady hand who spots problems early, so your move stays calm and on track from start to finish.',
    ],
    values: [
      ['Honesty over the hard sell', 'We tell you what a home is really worth and point out the flaws along with the perks. You get straight advice, so you can decide with clear eyes and zero pressure.'],
      ['Local knowledge that pays off', 'We know these neighborhoods, schools, and price trends inside out. That insight means sharper pricing when you sell and smarter offers when you buy.'],
      ['In your corner start to finish', 'From the first tour to the closing table, we handle the details and keep you informed. You always know what comes next, and you are never left guessing.'],
    ],
    approach: ['How working with us feels', 'It starts with a relaxed conversation about your goals and timeline; there is no pressure and no obligation. If we move forward, we map a clear plan and honest pricing, then handle the showings, offers, and paperwork. We negotiate hard on your behalf, flag issues early, and keep you updated at every step, so your move stays calm and clear all the way to closing.'],
    servicesIntro: 'Buying or selling a home is a big move, and the right guide changes everything. Our services cover the whole journey. That means honest pricing, sharp neighborhood insight, smart negotiation, and clean paperwork. First-time buyer or seasoned seller, you get clear advice and a steady advocate who puts your interests first.',
    serviceLong: [
      'Buying a home should feel exciting, not overwhelming, so we guide you through every step. We learn what you need, show you homes that truly fit, and give you an honest read on each one, including the flaws. When you find the right place, we help you craft a smart offer, navigate inspections, and get to closing without nasty surprises. First-time buyer or fifth, you always know what comes next.',
      'Selling your home is about getting its true value with as little stress as possible. We start with honest, data-backed pricing, then advise on the simple prep and staging that help it show its best. Sharp photos and smart marketing bring in the right buyers, and we negotiate hard to protect your bottom line, handling the details so you can focus on your next chapter.',
      'Wondering what your home is worth right now? Our valuation gives you an honest, data-backed estimate grounded in recent local sales and the real condition of your home. No inflated promises and no lowball guesses, just a clear number you can plan around, whether you are ready to list this month or simply weighing your options for down the road.',
      'A good decision starts with a clear picture of the market. Our market analysis breaks down what is really happening in your neighborhood, from prices to days on market to buyer demand. We translate the data into plain language, so you can time your buy or sale wisely and move with confidence instead of second-guessing yourself.',
      'Small, smart changes can add real dollars to your sale price. We advise on the repairs, decluttering, and light staging that help your home make a strong first impression, without overspending on things buyers will not notice. From curb appeal to the perfect showing-ready look, we help your home stand out and attract stronger, faster offers.',
      'Moving to or from the area brings a long to-do list, and we help you carry it. Whether you are relocating for work or simply putting down roots somewhere new, we share neighborhood guidance, trusted referrals for lenders and movers, and a clear plan that keeps everything on schedule. A new place starts to feel like home a whole lot faster with a local guide by your side.',
    ],
    why: [
      ['Honest, data-backed pricing', 'We price with recent local sales, not wishful thinking, so you buy or list with confidence and never overpay or leave money on the table.'],
      ['Deep local expertise', 'We know these streets, schools, and price trends because we live here too. That insight works in your favor on every offer and every listing.'],
      ['A steady negotiator', 'We advocate hard for your bottom line and keep the deal moving, flagging problems early so your move stays calm from first tour to closing.'],
    ],
    contactIntro: 'Whether you are ready to tour homes, thinking about selling, or just curious what your place is worth, we would love to hear from you. Fill out the form or give us a call and a real person, not a machine, will get back to you promptly. There is no pressure and no obligation, just honest local guidance to help you take your next step with confidence.',
    faqMore: [
      ['How do you decide on a listing price for my home?', 'We start with recent sales of comparable homes in your neighborhood, then adjust for your home’s condition, features, and the current market. You get an honest, data-backed price with the reasoning behind it, so you can list with confidence rather than guessing or chasing an inflated number.'],
      ['Should I buy or sell first?', 'It depends on your finances, the market, and your comfort with timing. We walk you through the trade-offs of each path, from bridge financing to contingent offers, and help you choose the approach that fits your situation. There is no single right answer, only the right one for you.'],
      ['How do you market a home that is for sale?', 'We prepare your home to show its best, capture sharp professional photos, and put it in front of the right buyers online and through our local network. Then we track the response, keep you updated, and adjust as needed, all aimed at a strong offer as quickly as possible.'],
      ['What if I am just starting to think about a move?', 'That is a great time to reach out. Even if you are months away, an early conversation helps you understand your options, your home’s value, and the market. There is no pressure and no obligation; we are happy to answer questions now so you feel ready when the time comes.'],
    ],
  },
  agency: {
    aboutP34: [
      'We started this studio on a stubborn belief: beautiful work that does not perform is just decoration. Too many agencies chase awards or bill hours while the client’s actual goals gather dust. So we built a small, senior team that treats your outcomes as seriously as our craft, tying every design choice and every campaign to results you can measure. Strategy first, always, and creative that earns its keep.',
      'When you hire us, experienced people do your work directly, from the first idea to the final launch; there are no junior handoffs happening quietly behind the scenes. We start with your goals, share a clear scope and timeline, and hit our deadlines. We act like an extension of your team, not a distant vendor, because we genuinely win only when you win.',
    ],
    values: [
      ['Strategy before style', 'We start with your goals, your audience, and your market, not a template. The prettiest work in the world fails if it is aimed at the wrong target.'],
      ['Senior hands only', 'Experienced specialists do your work directly, start to finish. No junior handoffs, no learning on your dime; just seasoned people who know how to deliver.'],
      ['Accountable to results', 'We tie creative to outcomes and report on what actually moves. Beautiful is the baseline; effective is the point, and we hold ourselves to it.'],
    ],
    approach: ['How we work together', 'It starts with discovery: we dig into your goals, your audience, and your market until we understand what success really looks like. Then we design strategy and creative built to perform, ship polished work on time and on scope, and measure the results. From there, we refine what works and keep pushing, acting as a true partner in your growth rather than a one-and-done vendor.'],
    servicesIntro: 'Great brands are built, not stumbled into, and they are built through strategy, design, and campaigns that work together. From a distinctive identity to a site that converts to full-funnel marketing that actually moves the needle, our services connect into one coherent effort aimed at your goals. Explore what we do, and imagine what focused, senior craft could do for your growth.',
    serviceLong: [
      'Your brand identity is how the world recognizes and remembers you, so we build it to last rather than to chase a trend. From logos and visual systems to voice and messaging, we craft an identity that is unmistakably yours and works everywhere you show up. The result is a brand that feels cohesive, confident, and genuinely distinct from the crowd.',
      'A website is often your hardest-working salesperson, so we design and build sites that turn visitors into customers. Fast, beautiful, and built to convert, every page is shaped around your goals and the needs of your audience. We sweat the details that drive results, from the first impression to the final call to action, and we build on a foundation that scales as you grow.',
      'Marketing campaigns get attention and, more importantly, drive action. We plan and run full-funnel campaigns across the channels that matter to your audience, from awareness to conversion, all tied to clear goals. Every dollar is aimed at an outcome, and we report honestly on what is working so we can double down on what drives real growth.',
      'Content and social keep your brand present, relevant, and worth following. We plan and produce content people actually want, from the strategy down to the posts, so you grow an audience rather than shout into the void. Consistent, on-brand, and genuinely useful, it builds the kind of trust that turns followers into customers over time.',
      'Sustainable growth is built on real search demand, not shortcuts that stop working the moment the algorithm shifts. Our SEO and growth work targets the terms your customers actually search, improves the technical foundation, and earns lasting visibility. It is a long game played well, compounding over time into a dependable stream of the right kind of traffic.',
      'Creative direction is the guiding vision that keeps every piece sharp, consistent, and on brand. Across a campaign, a website, or an entire identity, we provide the through-line that ties the work together and holds it to a high standard. It is the difference between a scattered set of assets and a brand that speaks with one confident voice.',
    ],
    why: [
      ['Senior team on every project', 'Experienced specialists handle your work directly, from first idea to final launch. No junior handoffs, ever, so you always get seasoned judgment.'],
      ['Clear, fixed scopes', 'Every engagement has a defined scope, timeline, and price agreed up front. No surprise invoices, no scope creep, no meter running on every call.'],
      ['Built to perform', 'We tie creative to outcomes and measure what moves. You get work that is beautiful, yes, and effective, which is the whole point.'],
    ],
    contactIntro: 'Have a project in mind, a goal you are chasing, or a brand that needs a refresh? Tell us about it. Send a message or reach out and a senior member of our team, the same people who would do the work, will get back to you promptly. We will listen, ask sharp questions, and map a clear plan to hit the goals that matter to you.',
    faqMore: [
      ['What size clients do you usually work with?', 'We work with a range, from ambitious startups to established companies, and we scope each engagement to fit. What our clients share is a real goal and a willingness to invest in doing it right. Tell us where you are and what you want to achieve, and we will be honest about whether we are the right partner.'],
      ['Can you work with our existing brand and team?', 'Absolutely. We often plug into an existing brand and collaborate closely with in-house teams, acting as an extension rather than a replacement. We respect what you have built, bring senior firepower where you need it, and hand off cleanly, with documentation, so your team can carry the work forward with confidence.'],
      ['How do you measure the success of your work?', 'We define success with you at the start, tied to your actual goals, whether that is conversions, qualified leads, brand awareness, or growth. Then we track those metrics and report honestly, so you always know what is working. Beautiful work is the baseline; measurable results are how we judge whether we have truly delivered.'],
      ['What is your typical timeline and process?', 'It depends on scope, but most brand and web projects run from a few weeks to a couple of months, and we share a realistic timeline before we start. Our process moves through discovery, design, launch, and measurement, with clear milestones so you always know where things stand and what comes next.'],
    ],
  },
  portfolio: {
    aboutP34: [
      'I take on a handful of projects at a time, on purpose. It means every client gets my full attention and every detail gets the care it deserves. I would rather do a few things exceptionally than many things adequately, so I keep my roster small, my communication clear, and my focus squarely on making work I am genuinely proud to put my name on.',
      'Every project starts from your goals, never a canned formula. I listen first, map a clear scope and timeline, and keep you posted at every step, with no jargon and no surprises. I hit my deadlines, sweat the small stuff so the final work feels effortless, and build things that hold up long after launch day. My favorite part of the job is a client who is truly thrilled with the result.',
    ],
    values: [
      ['Craft over hype', 'I sweat the details other people skip, so the finished work feels effortless. Quality is not a buzzword to me; it is the whole reason I do this.'],
      ['Clear from start to finish', 'You always know where a project stands and what comes next. Straight talk, quick replies, and zero ego make working together genuinely easy.'],
      ['Made to last', 'I build work that holds up long after launch day, not just work that photographs well on day one. Longevity is part of good design.'],
    ],
    approach: ['How we will work together', 'It starts with a conversation: tell me about your project, your goals, and what success looks like to you. I map a clear scope, timeline, and fixed price, so there are no surprises. Then I do the work with care, keeping you posted along the way, and deliver polished, ready-to-use results. Throughout, I keep communication easy, because good collaboration makes for better work.'],
    servicesIntro: 'I offer a focused set of things I do genuinely well, rather than a little of everything done adequately. Whether you need thoughtful design, striking photography, a memorable brand, or a fast, elegant website, you get the same care and craft on every project. Take a look at what I make, and let us talk about bringing your idea to life.',
    serviceLong: [
      'Good design is clear before it is clever. I create clean, purposeful work that communicates your message and looks the part, always with the goal guiding the form. Whether it is a layout, an interface, or a set of materials, I focus on making something that works beautifully and feels considered down to the smallest detail, never decoration for its own sake.',
      'Photography is about capturing the real thing, beautifully. I shoot striking, story-driven images that feel authentic rather than staged, whether it is for a brand, a product, or a moment worth remembering. Good light, honest composition, and an eye for the telling detail turn a simple photo into something that genuinely connects with the people who see it.',
      'A brand is a point of view, not just a logo. I build identities with real character, designed to be recognized and remembered across everything you do. From the mark to the palette to the voice, I craft a cohesive system that feels unmistakably yours, so your brand shows up with confidence wherever it appears.',
      'A great website should feel as good as it looks. I design and build fast, elegant sites that are a pleasure to use, shaped around your goals and your visitors. Clean, considered, and built to perform, every page is crafted with care, so the finished site works smoothly, loads quickly, and represents you exactly the way you want.',
      'Sometimes you just need a second set of expert eyes. Through consulting, I help sharpen your work and your direction, offering honest feedback and practical guidance drawn from years of hands-on craft. Whether you are stuck, second-guessing, or simply want a knowledgeable sounding board, I will help you see the path forward more clearly.',
      'I love teaming up with good people on ambitious projects. Collaborations are where great work often happens, and I bring my craft, reliability, and easygoing communication to every partnership. If you have got a project that needs an extra hand or a fresh perspective, let us make something genuinely good together.',
    ],
    why: [
      ['Available for new work', 'I am currently taking on projects and would love to hear about yours. Reach out and let us find a time to talk about what you have in mind.'],
      ['A clear, fixed quote', 'I scope each project individually and give you a fixed price before we begin, so you know exactly what to expect, with no surprises down the line.'],
      ['Detail-obsessed delivery', 'I sweat the small stuff and hit my deadlines, so you get polished, ready-to-use work, on time, that you will be genuinely proud to show off.'],
    ],
    contactIntro: 'Have a project in mind, or just want to see if we are a good fit? I would love to hear from you. Send a message or reach out directly, and I will get back to you personally, usually within a day. Tell me a bit about what you are working on and what you are hoping to achieve, and I will let you know how I can help.',
    faqMore: [
      ['What kinds of projects do you take on?', 'I focus on design, photography, branding, and web work, and I am happiest on projects where craft and care make a real difference. If you are not sure whether your idea is a fit, just ask; I will give you an honest answer and, if it is not right for me, I am glad to point you somewhere that is.'],
      ['How involved will I be in the process?', 'As involved as you would like to be. I keep communication clear and check in at the key moments, so you always know where things stand. Some clients want to weigh in on every detail; others prefer to set the direction and let me run with it. Either way works well, and I will adapt to your style.'],
      ['What do you need from me to get started?', 'Mostly just a clear sense of your goals and any materials you already have, like brand assets, examples you love, or notes on what you are picturing. Do not worry about having everything figured out; part of my job is helping you shape the idea. We will fill in the gaps together as we go.'],
      ['Do you offer revisions?', 'Yes. Thoughtful revisions are a normal part of getting the work right, and I build a reasonable round or two into every project so we can refine the details together. My goal is always a result you are genuinely thrilled with, so we will keep polishing until it truly feels right.'],
    ],
  },
};

// About-page closing band (headline + paragraph) — the human, forward-looking sign-off
// that pushes every /about page comfortably past 500 words across its sections.
const ABOUT_CLOSE = {
  medical: ['We would love to meet you', 'Whether it has been six months or six years since your last checkup, there is a warm welcome and a comfortable exam room waiting for you. New patients are always welcome, and we make the first visit easy, from paperwork to insurance. Come see what honest, personal primary care feels like, and let us help you and your family stay healthy for years to come.'],
  dental: ['We would love to meet you', 'Whether it has been six months or six years since your last visit, there is a warm welcome and a clean, comfortable chair waiting for you. New patients are always welcome, and we make the first visit easy, from paperwork to insurance. Come see what gentle, honest dental care feels like, and let us help you keep your smile healthy for years to come.'],
  wellness: ['Come find your place on the mat', 'You do not need to be flexible, fit, or experienced to belong here; you just need to show up. Your first class is on us, so come as you are, meet a teacher, and see how good it feels to slow down and breathe. Whenever you are ready, we will be here, and we would be honored to practice alongside you.'],
  fitness: ['Come lift with us', 'You do not need to be fit, experienced, or fearless to belong here; you just need to show up. Your first session is on us, so come as you are, meet the coaches, and feel what real training does. Whenever you are ready to get strong, we will be here, and we would be glad to train right beside you.'],
  legal: ['Let us help you move forward', 'Facing a legal matter is stressful, but you do not have to face it alone or unsure of your options. Reach out for a free, confidential consultation and get honest guidance from an experienced advocate who will treat your matter with the seriousness and care it deserves. Whatever you are dealing with, the first step is simply a conversation.'],
  restaurant: ['We saved you a seat', 'Good food and good company are what we are all about, and there is always a warm welcome waiting when you walk through our doors. Whether it is a quiet dinner, a weekend brunch, or a big celebration with everyone you love, come hungry and leave happy. We cannot wait to cook for you and to make you feel right at home.'],
  'local-service': ['Trusted work is one call away', 'When you need something fixed, installed, or maintained, you deserve a team that shows up on time, charges fairly, and stands behind the work. That is exactly what we do, on every job, for every neighbor. Give us a call or request a free quote, and let us show you what dependable, honest service really looks like.'],
  nonprofit: ['Join us and see the difference', 'Real change happens when people decide to show up for one another, and there is a place for you in this work. Whether you give, volunteer, or simply spread the word, your support becomes meals, mentoring, and hope for neighbors who need it. Together we can do far more than any of us could alone, so we hope you will join us.'],
  retail: ['Shop with total confidence', 'We built this shop for people who are tired of flimsy products and pushy service, and we would love for you to give us a try. Every item is chosen with care, backed by easy returns, and shipped fast, so you can buy exactly what you want without a second thought. Browse the collections, and discover goods actually worth owning.'],
  saas: ['Get your time back, starting today', 'Your team has better things to do than the same repetitive tasks, week after week. We built this platform to hand those hours back, so you can focus on the work that actually matters. Start your free trial with no credit card, connect your tools in minutes, and see for yourself how much lighter the week feels when the busywork runs itself.'],
  'real-estate': ['Let us guide your next move', 'Whether you are buying your first home, selling the one you love, or simply curious what your place is worth, we would be glad to help. Reach out for a friendly, no-pressure conversation and get honest local guidance from an agent who treats your move like their own. Whenever you are ready, we will be here to guide you all the way home.'],
  agency: ['Let us build something that works', 'The best partnerships start with a clear goal and a shared commitment to hitting it. If you have a brand to build, a site to launch, or a campaign that needs to perform, we would love to hear about it. Tell us where you want to go, and we will map a plan to get you there, with senior craft and a genuine stake in your success.'],
  portfolio: ['Let us make something great together', 'I take on a handful of projects at a time so each one gets my full attention, and I would love for yours to be one of them. If you care about craft as much as I do and have an idea worth doing right, reach out. Tell me what you are picturing, and let us talk about how to bring it to life, beautifully.'],
};

// About-page promise band (headline + paragraph) — a concrete commitment that lifts
// every /about page to a comfortable 500+ words. Name-agnostic, no slop.
const ABOUT_PROMISE = {
  medical: ['Our promise to every patient', 'We promise to treat you the way we would want our own family treated: with patience, honesty, and genuine care. That means no lectures, no pressure, and no tests you do not need. It means clear guidance, careful explanations, and a team that remembers you between visits. Above all, it means you can walk in worried and walk out reassured, knowing your health is in caring, capable hands.'],
  dental: ['Our promise to every patient', 'We promise to treat you the way we would want our own family treated: with patience, honesty, and a genuinely gentle touch. That means no lectures, no pressure, and no treatment you do not need. It means clear pricing, careful explanations, and a team that remembers you between visits. Above all, it means you can walk in nervous and walk out relieved, knowing your smile is in caring, capable hands.'],
  wellness: ['Our promise to you', 'We promise a space with no ego and no judgment, where your practice is measured by how you feel, not how you look. We promise teachers who watch out for your safety, options for every body, and a community that is genuinely glad you came. Whether you are here for strength, stress relief, or a quiet hour to yourself, we promise to meet you exactly where you are, every single time.'],
  fitness: ['Our promise to every member', 'We promise a gym with no ego and no judgment, where your progress is measured by your own numbers, not by anyone else. We promise coaches who put your technique and safety first, weights scaled to every level, and a crew that is genuinely glad you showed up. Whether you are chasing your first barbell or a new personal best, we promise to meet you exactly where you are, every single session.'],
  legal: ['Our promise as your advocate', 'We promise honest counsel, even when it is not what you hoped to hear, because you deserve the truth about your options. We promise a senior attorney who knows your case, returns your calls, and treats your matter with real urgency. And we promise to fight for the best outcome we can achieve, keeping you informed and in control every step of the way. Your trust is something we work hard to earn.'],
  restaurant: ['Our promise at every table', 'We promise food made from scratch with real ingredients, never shortcuts, because you can taste the difference and you deserve it. We promise a warm welcome, attentive service, and a room that feels like the best kind of gathering. And we promise to treat every guest like family, whether it is your first visit or your fiftieth. Great food should taste like someone cared, and here, someone always does.'],
  'local-service': ['Our promise on every job', 'We promise to show up when we say we will, quote the real price before we start, and treat your home with the respect it deserves. We promise fully licensed, insured technicians and quality work backed in writing. And if something is ever not right, we promise to make it right, no argument and no excuses. Dependable, honest service is not a slogan for us; it is the standard we hold on every single visit.'],
  nonprofit: ['Our promise to this community', 'We promise that the large majority of every gift goes straight to the people we serve, and that we will share our impact openly so you can see it. We promise to treat everyone who comes to us with dignity and warmth, and everyone who gives with genuine gratitude. Your generosity is a trust, and we promise to honor it by putting it to work where it matters most, right here at home.'],
  retail: ['Our promise on everything we sell', 'We promise to stock only what we would recommend to a friend, at prices that are simply fair, with no gimmicks at checkout. We promise fast, free shipping on qualifying orders and returns so easy you can buy with total confidence. And we promise to treat you like a person, not an order number, whenever you need a hand. Buy better, buy less, and love what you own; that is the whole idea.'],
  saas: ['Our promise to your team', 'We promise software that saves you time instead of adding another chore, and pricing that is clear with no hidden fees. We promise security built in from the start and performance that holds as you grow. And we promise real human support that answers fast, with no phone trees or canned replies. Great software should feel like a reliable teammate who never drops the ball, and that is exactly what we set out to build.'],
  'real-estate': ['Our promise to every client', 'We promise honest guidance, even when it is not what you hoped to hear, because you deserve the truth about a home’s value and condition. We promise sharp, data-backed pricing, deep local knowledge, and a negotiator who fights for your bottom line. And we promise to keep you informed at every step, from the first tour to the closing table. Your trust means more to us than any single sale, and we work to earn it every day.'],
  agency: ['Our promise to every client', 'We promise strategy before style and creative that is accountable to real results, because beautiful work that does not perform is just decoration. We promise senior specialists on your project from start to finish, with no junior handoffs behind the scenes. And we promise clear scopes, honest timelines, and no surprise invoices. We treat your business like our own, because we only truly win when you win. That is the partnership we offer.'],
  portfolio: ['My promise on every project', 'I promise to take on only what I can give my full attention, so your work never gets rushed or phoned in. I promise clear communication, honest timelines, and a fixed price agreed up front, with no surprises. And I promise to sweat the details other people skip, so the finished work feels effortless and holds up long after launch. Your trust means everything to me, and I work hard on every project to earn it.'],
};

// Contact-page closing help band (headline + paragraph) — a warm, practical sign-off
// that pushes every /contact page past 500 words across its sections.
const CONTACT_HELP = {
  medical: ['We are here whenever you need us', 'There is no wrong reason to reach out. Maybe you are overdue for a physical, choosing a doctor for your family, worried about a nagging symptom, or simply want to know if we take your insurance. Whatever it is, we would rather answer your questions now than have you put off the care you need. Send a message or pick up the phone, and let us make your next visit an easy one.'],
  dental: ['We are here whenever you need us', 'There is no wrong reason to reach out. Maybe you are overdue for a cleaning, comparing dentists for your family, worried about a specific tooth, or simply want to know if we take your insurance. Whatever it is, we would rather answer your questions now than have you put off the care you need. Send a message or pick up the phone, and let us make your next visit an easy one.'],
  wellness: ['We would love to hear from you', 'Maybe you have practiced for years, or maybe you have never set foot in a studio and the whole idea feels a little intimidating. Either way, you are exactly who we built this space for, and we are happy to answer any question, big or small. Reach out about classes, memberships, or your very first visit, and we will help you feel at home before you ever step on the mat.'],
  fitness: ['We would love to hear from you', 'Maybe you have trained for years, or maybe you have never touched a barbell and the whole idea feels a little intimidating. Either way, you are exactly who we built this gym for, and we are happy to answer any question, big or small. Reach out about training, memberships, or your very first session, and we will help you feel at home before you ever pick up a weight.'],
  legal: ['Reach out and take the first step', 'Legal questions have a way of keeping you up at night, and the uncertainty is often the hardest part. You do not have to carry it alone. Reach out for a free, confidential conversation and get an honest read on where you stand, with no cost and no obligation. Whether you end up needing us or not, you will leave the call with more clarity than you had before, and that is a good place to start.'],
  restaurant: ['Let us help you plan something great', 'Whether you are booking a quiet table for two, planning a big celebration, or arranging catering for an event, we are happy to help you get every detail right. Have a food allergy, a special request, or a question about the menu? Just ask. We would rather hear from you ahead of time and make your experience perfect than leave anything to chance. Reach out however is easiest, and let us take care of the rest.'],
  'local-service': ['Reach out and get it handled', 'A problem at home has a way of nagging at you until it is fixed, and putting it off usually just makes it worse. Let us take it off your plate. Reach out with what is going on, and we will give you a straight answer, a fair quote, and a real plan to solve it, often the same day for urgent issues. One call is all it takes to get dependable help on the way.'],
  nonprofit: ['Every message moves the mission', 'Whether you want to give, lend a hand, or simply learn more about the work we do, reaching out is the first step, and it matters more than you might think. Every volunteer, every gift, and every partnership starts with a single conversation. We read each message personally and would be glad to help you find the right way to get involved. Together, we can do far more than any of us could alone.'],
  retail: ['We are here to help, always', 'Great products deserve great service, and we take that seriously long after you check out. Whether you need help choosing the right item, have a question about an order, or want to arrange a return, we are here and happy to sort it out quickly. Reach out anytime and a real member of our team will get back to you fast. We want you to love what you buy, no exceptions.'],
  saas: ['Let us help you get started', 'Whether you are just kicking the tires, setting things up, or weighing whether the platform fits your team, we are glad to help, and we promise no pushy sales tactics. Reach out with any question and a real person will get back to you fast, or book a quick demo tailored to what you need. Better yet, start your free trial right now; there is no credit card required and nothing to lose.'],
  'real-estate': ['We would love to help you move', 'Maybe you are ready to tour homes this weekend, or maybe you are just starting to wonder what your place is worth. Either way, you are exactly who we are here for, and we are happy to answer any question, big or small. Reach out about buying, selling, or a free home valuation, and we will help you feel confident and clear before you take a single step.'],
  agency: ['Tell us what you are building', 'The best work starts with a good conversation, so do not worry about having a polished brief. Whether you have a clear goal or just a rough idea, reach out and a senior member of our team, the same people who would do the work, will get back to you promptly. We will listen, ask the right questions, and map a clear plan to hit the goals that matter most to you. Let us build something that works.'],
  portfolio: ['Let us start a conversation', 'Whether you have a fully-formed project in mind or just a spark of an idea, I would genuinely love to hear about it. Reach out and tell me a bit about what you are working on and what you are hoping to achieve, and I will reply personally, usually within a day. I will give you my honest thoughts on how I can help, and whether I am the right person for the job. No pressure, just a good conversation.'],
};

// Two more general FAQ items per vertical → the FAQ page reaches 12-13 questions
// and clears 500+ words comfortably. 40-60-word answers, guess-ahead, no slop.
const FAQ_MORE2 = {
  medical: [
    ['Can I be seen the same day when I am sick?', 'Very often, yes. We hold open slots each day for urgent visits, so call us early and we will do our best to fit you in. If it is more serious, we will help you decide whether to be seen here or head to urgent care or the ER. Your health guides the pace, always.'],
    ['Can I bring my whole family to one practice?', 'Yes, and many families do. We care for every age, from a toddler’s well-child visit to a grandparent’s blood-pressure check, and we keep everyone’s records in one place. It means fewer offices to juggle, one team who knows you all, and appointments you can often schedule back to back.'],
  ],
  dental: [
    ['Will my visit hurt?', 'We work hard to keep every visit comfortable, with gentle technique, effective numbing, and sedation options when you want them. Most patients are surprised by how easy it is. If anything ever feels off, just raise a hand and we stop and adjust right away. Your comfort guides the pace, always.'],
    ['Can I bring my whole family to one practice?', 'Yes, and many families do. We care for every age, from a toddler’s first checkup to a grandparent’s crown, and we keep everyone’s history in one place. It means fewer offices to juggle, one team who knows you all, and appointments you can often schedule back to back.'],
  ],
  wellness: [
    ['What if I cannot keep up with the class?', 'You never have to. Every class is built around going at your own pace, and resting whenever you need to is not just allowed, it is encouraged. Our teachers offer easy options for every pose, so you can dial the effort up or down. There is no keeping up here, only showing up.'],
    ['How do I know which class is right for me?', 'Tell us how you want to feel and we will point you to the right class. Craving energy and a sweat? Try flow or power. Need to unwind? Restorative or gentle. Want a calmer mind? Meditation. If you are still unsure, come try an intro class and we will help you find your fit.'],
  ],
  fitness: [
    ['What if I cannot keep up with a class?', 'You never have to. Every session scales to your level, and resting or lightening the load whenever you need to is not just allowed, it is smart training. Our coaches offer easier options for every movement, so you can push hard or ease in. There is no keeping up here, only showing up and getting better.'],
    ['How do I know which program is right for me?', 'Tell us your goals and we will point you the right way. Want expert eyes on every rep? Personal training. Like training with a crew? Small-group classes. Chasing a bigger total? Powerlifting coaching. New to it all? Start with barbell basics. If you are unsure, book a free session and we will help you find your fit.'],
  ],
  legal: [
    ['What happens during the free consultation?', 'We listen to your situation, ask a few questions, and give you an honest read on your options and likely next steps, all in plain language. There is no cost and no obligation. You will leave knowing where you stand and what we could do, whether or not you decide to hire the firm.'],
    ['Do you handle cases like mine?', 'We focus on the matters families and businesses face most, and we are honest about fit. When you reach out, tell us briefly what is going on, and we will let you know right away whether we can help, or point you toward someone who can. You will never be strung along.'],
  ],
  restaurant: [
    ['Is the restaurant good for a special occasion?', 'Absolutely. From anniversaries to birthdays to celebrations of every kind, we love helping make a night memorable. Let us know it is a special occasion when you book, and we will do our best to make it feel that way, whether that means a quiet table or a little something extra.'],
    ['Do you have a bar or drink menu?', 'We do. We keep a thoughtful list of wine, beer, and house cocktails chosen to pair well with the menu, so there is something to complement whatever you order. Ask your server for a recommendation; they are happy to suggest the perfect match for your meal or your mood.'],
  ],
  'local-service': [
    ['How long will the work take?', 'It depends on the job, but we will give you a realistic estimate up front, before we begin, so you can plan your day. We show up prepared to work efficiently and cleanly, and we will keep you posted if anything changes. Our goal is to do it right the first time, without dragging it out.'],
    ['Will you clean up when the job is done?', 'Every time. We protect your floors and surfaces while we work and tidy up thoroughly when we finish, so your home is left as clean as we found it, if not cleaner. To us, respecting your space is just as important as doing quality work, and both come standard on every job.'],
  ],
  nonprofit: [
    ['Where does my donation actually go?', 'Straight to our programs and the neighbors they serve. Because we are powered by volunteers and careful stewardship, the large majority of every gift funds direct help: meals, mentoring, and emergency support. We publish our impact openly, so you can always see exactly how your generosity turns into real, local change.'],
    ['Can I give in memory or honor of someone?', 'Yes, and it is a meaningful way to give. Tribute gifts let you honor a loved one or celebrate a special occasion while supporting our mission. Just let us know when you donate, and we will make sure it is handled thoughtfully. Reach out and we will walk you through the options.'],
  ],
  retail: [
    ['Do you ship quickly?', 'We do. Most orders ship within a business day and arrive quickly, with tracking so you can follow along every step of the way. Qualifying orders ship free, and smaller orders ship at a flat, fair rate you will see before you check out. No long waits and no surprise fees.'],
    ['Will you restock items that sell out?', 'Often, yes. Popular pieces do sell out, but many come back. Sign up for a restock alert on any sold-out product and we will email you the moment it returns. If you are ever unsure whether something is coming back, just ask us and we will let you know what we can.'],
  ],
  saas: [
    ['Can I try it before I commit?', 'Yes. Your 14-day free trial requires no credit card, so you can explore the full platform, connect your tools, and invite your team with zero risk. See the time savings for yourself first, and only choose a paid plan if it earns its place. There is genuinely nothing to lose.'],
    ['What if my team needs help getting set up?', 'We are here for exactly that. Setup usually takes minutes, but if you get stuck, our support team answers fast by chat or email, with real humans and no canned replies. We can also walk you through a guided setup so your whole team is up and running smoothly from day one.'],
  ],
  'real-estate': [
    ['Do I need to be pre-approved before we start looking?', 'It helps a lot. A pre-approval shows what you can comfortably afford and makes your offers stronger in a competitive market. If you are not there yet, no problem; we can connect you with a trusted local lender and start touring homes to sharpen your sense of what you want.'],
    ['What happens after my offer is accepted?', 'The fun part is just beginning. We guide you through inspections, appraisal, and financing, keep every deadline on track, and handle the paperwork. If anything comes up, we flag it early and negotiate on your behalf. Then we walk you right up to closing day and the keys to your new home.'],
  ],
  agency: [
    ['How do we get started with you?', 'Just reach out and tell us about your goals, in as much or as little detail as you have. A senior member of our team will get back to you promptly, and from there we map a clear scope, timeline, and fixed price. Once you approve, we get to work, keeping you in the loop throughout.'],
    ['What makes you different from other agencies?', 'Senior people do your work directly, start to finish, with no junior handoffs, and we tie every creative choice to real results rather than awards. We keep scopes clear and fixed, hit our deadlines, and act like an extension of your team. In short, we care about your outcomes as much as our craft.'],
  ],
  portfolio: [
    ['How far in advance should I book you?', 'It depends on my current roster, since I take on just a few projects at a time to keep the quality high. The best move is to reach out early with your timeline, and I will let you know honestly when I could start. If I am booked, I am always glad to suggest the next best step.'],
    ['What if I am not totally sure what I need yet?', 'That is completely fine, and more common than you would think. Part of my job is helping you shape a rough idea into a clear plan. Reach out with whatever you have got, and we will figure out the details together. You do not need everything sorted before we start the conversation.'],
  ],
};

// Contact-page extras: a reassurance paragraph + 3 "ways to reach us" points, so the
// /contact page ships several real sections instead of a bare form.
const CONTACT_EXTRA = {
  medical: {
    reassure: 'We know that calling a doctor’s office can feel like a chore, or even a little nerve-wracking. It should not be. Our front desk is friendly, patient, and genuinely helpful, whether you are booking a routine physical, asking about a test result, or dealing with a sudden illness. Reach out however is easiest for you, and we will take care of the rest with the same personal approach we bring to every visit.',
    points: [['New patients', 'Booking your first visit is simple. Send a message or call, and we will walk you through paperwork, insurance, and scheduling before you ever arrive.'], ['Feeling sick today?', 'Call us early and mention it is urgent. We hold same-day slots for sick visits and will do everything we can to get you seen and on the mend fast.'], ['Billing questions', 'Have a question about a bill or your coverage? Reach out and a real person will explain everything clearly, with no runaround and no jargon.']],
  },
  dental: {
    reassure: 'We know that calling a dental office can feel like a chore, or even a little nerve-wracking. It should not be. Our front desk is friendly, patient, and genuinely helpful, whether you are booking a routine cleaning, asking about a treatment, or dealing with a sudden toothache. Reach out however is easiest for you, and we will take care of the rest with the same gentle approach we bring to every visit.',
    points: [['New patients', 'Booking your first visit is simple. Send a message or call, and we will walk you through paperwork, insurance, and scheduling before you ever arrive.'], ['In pain today?', 'Call us right away and mention it is urgent. We hold same-day slots for emergencies and will do everything we can to get you seen and out of pain fast.'], ['Billing questions', 'Have a question about a bill or your coverage? Reach out and a real person will explain everything clearly, with no runaround and no jargon.']],
  },
  wellness: {
    reassure: 'We want the studio to feel welcoming from the very first hello, long before you ever roll out a mat. If you have questions about which class to try, how memberships work, or what to expect as a total beginner, please do not hesitate to reach out. There are no silly questions here, and a real person from our team will happily help you feel at home before your first visit.',
    points: [['First-timers', 'Not sure where to begin? Tell us how you want to feel and we will recommend the perfect class, plus everything you need to know before you arrive.'], ['Memberships and packs', 'Curious about pricing or which option fits your schedule? Reach out and we will help you choose, with no pressure and no commitment required.'], ['Private sessions', 'Interested in one-on-one guidance? Send a message and we will match you with an instructor and a time that works for your goals and your calendar.']],
  },
  fitness: {
    reassure: 'We want the gym to feel welcoming from the very first hello, long before you ever pick up a barbell. If you have questions about which program to try, how memberships work, or what to expect as a total beginner, please do not hesitate to reach out. There are no silly questions here, and a real member of our team will happily help you feel at home before your first session.',
    points: [['First-timers', 'New to lifting? Tell us your goals and we will recommend the right program, plus everything you need to know before you walk in for your first session.'], ['Memberships and packs', 'Curious about pricing or which plan fits your schedule? Reach out and we will help you choose, with no pressure and no long contract required.'], ['Personal training', 'Want one-on-one coaching? Send a message and we will match you with a coach and a time that fit your goals, your body, and your calendar.']],
  },
  legal: {
    reassure: 'Reaching out to a lawyer is often the hardest part, especially when you are stressed and unsure. We make it easy and pressure-free. Your initial consultation is free and completely confidential, and a member of our team will respond promptly with clear, practical next steps. You can speak freely, ask anything, and get an honest read on your options, whether or not you decide to work with us.',
    points: [['Free consultation', 'Tell us your situation in confidence and get an honest read on your options at no cost. There is no obligation, just clear guidance to help you decide.'], ['Urgent matters', 'Facing a deadline or an emergency? Let us know it is time-sensitive and we will prioritize getting back to you quickly with the guidance you need.'], ['General questions', 'Not sure whether you even need a lawyer? Reach out and we will tell you plainly, and point you in the right direction either way.']],
  },
  restaurant: {
    reassure: 'Whether you are planning a special night out, organizing a party, or just curious about the menu, we are always happy to hear from you. A real member of our team will help you with reservations, dietary questions, catering, or private events, so your experience with us is exactly what you are hoping for. Reach out however is easiest, and let us help you plan something delicious.',
    points: [['Reservations', 'Book a table online or give us a call. Planning for a big group? Let us know the size and we will make sure there is room for everyone.'], ['Catering and events', 'Hosting something special? Reach out and we will build a menu around your occasion, handle the details, and deliver food your guests will remember.'], ['Dietary needs', 'Have an allergy or a preference? Tell us ahead of time and our kitchen will happily accommodate, so everyone at your table can enjoy the meal.']],
  },
  'local-service': {
    reassure: 'When something in your home needs attention, the last thing you want is a runaround. Reach out and you will get a real person, a straight answer, and a fair, upfront quote, with no pressure and no surprise fees. Whether it is an urgent repair or a project you have been planning, we make getting help simple, and we treat your home and your time with the respect they deserve.',
    points: [['Free quotes', 'Tell us what is going on and we will provide a clear, no-obligation quote before any work starts. What we quote is what you pay, period.'], ['Emergencies', 'Got an urgent problem that cannot wait? Call and mention it is an emergency. We keep same-day slots open to get your home back to normal fast.'], ['Service area', 'Not sure if we cover your neighborhood? Give us your address and we will confirm right away, along with the soonest time we could come out.']],
  },
  nonprofit: {
    reassure: 'Every message we receive is a chance to do more good together, and we read each one personally. Whether you want to give, volunteer, ask about our programs, or explore a partnership for your business or group, we would love to hear from you. A real member of our team will follow up, because the people who reach out are the reason this mission works, and we never take that for granted.',
    points: [['Volunteer', 'Ready to lend a hand? Tell us your availability and interests, and we will match you with a meaningful role that fits your schedule and skills.'], ['Give', 'Want to support our work? Reach out with any questions about donating, and we will make giving simple and show you exactly where it goes.'], ['Partnerships', 'Interested in getting your company or group involved? Contact us and we will find a partnership that fits your values and makes a real impact.']],
  },
  retail: {
    reassure: 'Great products deserve great service, so if you have a question about an order, a product, or a return, we are here and happy to help. Reach out anytime and a real member of our team, not an automated bot, will get back to you quickly. We want you to love what you buy, and we will do whatever it takes to make your experience with us easy and worry-free.',
    points: [['Order help', 'Question about an order or need to make a change? Reach out as soon as you can and we will do our best to sort it out quickly for you.'], ['Recommendations', 'Not sure what to buy? Tell us what you are after and our team, who actually use what we sell, will point you to the right pick.'], ['Returns', 'Something not right? Our easy 30-day returns have you covered. Get in touch and we will make the refund or exchange painless.']],
  },
  saas: {
    reassure: 'Whether you are evaluating the platform, setting it up, or just have a quick question, we are glad to help, and there are no pushy sales tactics here. Reach out and a real member of our team will get back to you fast, by chat or email, with a clear answer or a hands-on demo. Or skip ahead and start your free trial; there is no credit card required and nothing to lose.',
    points: [['Book a demo', 'Want to see it in action first? Reach out and we will set up a quick, tailored walkthrough focused on exactly what your team needs.'], ['Sales questions', 'Curious about pricing, plans, or whether we fit your stack? Send a message and we will give you straight answers, with no pressure to buy.'], ['Get support', 'Already using the platform and need a hand? Our support team responds fast by chat or email, with real humans and no canned replies.']],
  },
  'real-estate': {
    reassure: 'Reaching out about a home is a big step, and it should feel easy, not intimidating. Whether you are ready to tour listings, thinking about selling, or simply curious what your place is worth, a real person from our team will help you, not a machine. There are no silly questions and no pressure here, just honest local guidance to help you feel confident about your next move.',
    points: [['Buying a home', 'Ready to start touring? Tell us what you are looking for and your timeline, and we will line up homes that fit and guide you every step of the way.'], ['Selling your home', 'Thinking about listing? Reach out for a free, honest valuation and a clear plan to sell for your home’s true value with as little stress as possible.'], ['Free home valuation', 'Just curious what your place is worth? Send a message and we will provide an honest, data-backed estimate based on recent sales, with no obligation.']],
  },
  agency: {
    reassure: 'The best work starts with a good conversation, so tell us what you are trying to achieve. Whether you have a fully-formed brief or just a rough idea, a senior member of our team, the same people who would do the work, will get back to you promptly. We will listen, ask sharp questions, and map a clear plan to hit your goals, with no jargon and no junior handoffs behind the scenes.',
    points: [['Start a project', 'Have something in mind? Tell us your goals and timeline, and we will map a clear scope and a plan to hit them, with a fixed price up front.'], ['Explore a fit', 'Not sure if we are the right partner? Reach out and we will be honest about whether we can help, and point you elsewhere if we cannot.'], ['Work with our team', 'Already have an in-house team? We plug in as an extension, bringing senior firepower exactly where you need it, and hand off cleanly.']],
  },
  portfolio: {
    reassure: 'I read and reply to every message personally, usually within a day. Whether you have a detailed project in mind or just want to see if we are a good fit, I would genuinely love to hear from you. Tell me a bit about what you are working on and what you are hoping to achieve, and I will let you know honestly how I can help, and whether I am the right person for the job.',
    points: [['New projects', 'Have a project in mind? Tell me your goals and I will share a clear scope, timeline, and fixed quote, so you know exactly what to expect.'], ['Just exploring', 'Not sure yet? That is fine. Reach out with your idea and I will give you honest thoughts, even if it turns out I am not the right fit.'], ['How I work', 'Curious about my process or availability? Ask away, and I will walk you through how we would collaborate from first hello to final delivery.']],
  },
};

// Contact page HEAD — the H1 (CONTACT_HEADLINE), its subheadline, and the page
// meta description. These 3 tokens were never emitted, so /contact shipped an
// EMPTY <h1> (gradient-text span with no text) on every vertical — an SEO + a11y
// defect (empty heading, no keyworded H1). Each entry: [headline, subheadline, meta].
// `_default` guarantees a non-empty H1 for any vertical not listed.
const CONTACT_HEAD = {
  medical: ['We’re here whenever you need us', 'Book a visit, ask about a result, or become a new patient — our team makes it simple.', 'Get in touch to book an appointment, ask about your care, or become a new patient. Friendly help by phone, email, or the form below.'],
  dental: ['Let’s get you smiling', 'Schedule a cleaning, ask about a treatment, or become a new patient — we’d love to hear from you.', 'Contact us to book a cleaning or exam, ask about treatment options, or become a new patient. Reach our friendly front desk any way you like.'],
  wellness: ['Come as you are', 'Book a session, ask about our services, or just say hello — we’re glad you’re here.', 'Reach out to book a session, ask about our services, or plan your first visit. Our team is here to help you feel calm, cared for, and welcome.'],
  fitness: ['Ready when you are', 'Book a tour, start a trial, or ask about memberships — let’s get you moving.', 'Get in touch to book a tour, claim a free trial, or ask about memberships and class schedules. Our team helps you find the right fit fast.'],
  legal: ['Let’s talk about your case', 'Request a consultation or ask a question — your first conversation is confidential and pressure-free.', 'Contact us to request a confidential consultation or ask about your situation. We respond promptly and explain your options in plain language.'],
  restaurant: ['Come dine with us', 'Reserve a table, plan an event, or ask about the menu — we can’t wait to host you.', 'Get in touch to book a table, plan a private event, or ask about the menu and hours. We’d love to welcome you and make your visit memorable.'],
  'local-service': ['Let’s get it handled', 'Request a quote, book a visit, or ask a question — we’ll respond fast.', 'Reach out for a free quote, to schedule service, or to ask a question. Our team responds quickly and shows up on time, every single visit.'],
  nonprofit: ['Join us — every hand helps', 'Volunteer, donate, or ask how you can help — there’s a place here for you.', 'Get in touch to volunteer, donate, partner with us, or learn more about our mission. Every message helps us serve our community a little better.'],
  retail: ['We’d love to help', 'Ask about a product, check availability, or plan a visit — we’re happy to help.', 'Contact us about a product, stock and availability, orders, or store hours. Our team is happy to help you find exactly what you’re looking for.'],
  saas: ['Let’s build something great', 'Ask a question, book a demo, or talk to our team — we usually reply within a day.', 'Get in touch to book a demo, ask about pricing and features, or talk to our team. We typically respond within one business day, often sooner.'],
  'real-estate': ['Let’s find your place', 'Ask about a listing, book a showing, or start your search — we’re here to guide you.', 'Reach out to ask about a listing, schedule a showing, or start your home search. Our team guides you through every step with real local insight.'],
  agency: ['Let’s make something', 'Tell us about your project, book a call, or just say hi — we’re all ears.', 'Get in touch to scope a project, book a discovery call, or ask about our work. We reply quickly and love a good creative challenge.'],
  portfolio: ['Let’s work together', 'Have a project in mind or just want to connect? Send a note — I’d love to hear from you.', 'Reach out to discuss a project, ask a question, or say hello. I read every message and reply personally — let’s create something together.'],
  _default: ['Get in touch', 'Have a question or ready to get started? Send us a message and we’ll be right with you.', 'Contact us with any question or to get started. Reach our team by phone, email, or the form below — we’re glad to help and reply quickly.'],
};

// Pricing page — only the 3 verticals with features.pricing:true (saas, fitness,
// wellness) render /pricing. Prices are HARD-CODED in src/pages/Pricing.tsx
// ($49 / $149 / $499 per month), so names + descriptions + feature bullets must
// FIT those price points. Comparison rows 3 and 4 have fixed value patterns in
// the page ('—'/'10 GB'/'Unlimited' and false/'partial'/true), so those two row
// labels describe a quantity and a partially-included capability. Without these
// tokens the page ships thin (empty tiers collapse) — journey 2026-08-28.
const PRICING = {
  saas: {
    headline: 'Simple pricing that scales with your team',
    subheadline: 'Start free, upgrade when you are ready, and only pay for what your team actually uses. Every plan includes core features, honest billing, and real human support.',
    meta: 'Clear, month-to-month pricing for teams of every size. Compare the Starter, Pro, and Enterprise plans, then start a 14-day free trial with no credit card required.',
    tiers: [
      {
        name: 'Starter',
        desc: 'Everything a small team needs to get organized and move faster, without the busywork.',
        features: ['Up to 5 team members', '10,000 tracked events per month', '3 shared dashboards', 'Email support within one business day'],
      },
      {
        name: 'Pro',
        desc: 'Built for growing teams that want deeper insight, more automation, and faster answers.',
        features: ['Up to 25 team members', '250,000 tracked events per month', 'Unlimited dashboards and reports', '50+ app integrations', 'Priority chat and email support'],
      },
      {
        name: 'Enterprise',
        desc: 'Advanced security, control, and support for larger organizations that cannot slow down.',
        features: ['Unlimited team members', 'Unlimited tracked events', 'Single sign-on with SAML and SCIM', 'Role-based access and audit logs', 'A 99.9% uptime SLA in writing', 'A dedicated account manager'],
      },
    ],
    compare: ['Core analytics and dashboards', 'Third-party integrations', 'Monthly event volume', 'Single sign-on (SSO/SAML)', 'Dedicated account manager'],
    faqs: [
      ['Is there a free trial?', 'Yes. Every plan starts with a 14-day free trial and no credit card is required. You get full access to the platform, so you can connect your tools, invite your team, and see the value before you ever pay a cent.'],
      ['Can I change or cancel my plan anytime?', 'You can. Upgrade, downgrade, or cancel whenever you like, right from your account settings, with no phone call and no penalty. If you cancel, you keep access through the end of the period you already paid for.'],
      ['Can I export my data if I leave?', 'Always. Your data belongs to you. You can export your events, reports, and account data to CSV at any time, and we will never hold it hostage or make you jump through hoops to get it back.'],
    ],
  },
  fitness: {
    headline: 'Membership plans for every goal',
    subheadline: 'Pick the plan that matches how often you train. Every membership is month-to-month, with expert coaching, no long contracts, and the freedom to change or pause whenever life happens.',
    meta: 'Simple month-to-month gym memberships for every level. Compare the Basic, Premium, and Unlimited plans, then book a free first session to find the right fit.',
    tiers: [
      {
        name: 'Basic',
        desc: 'A great start for lifters who want to train on their own schedule during the week.',
        features: ['Open-gym access on weekdays', 'Two group classes each week', 'Full use of racks, bars, and machines', 'A free intro session with a coach'],
      },
      {
        name: 'Premium',
        desc: 'Our most popular plan, for members who want more classes and hands-on coaching.',
        features: ['Open-gym access seven days a week', 'Unlimited group classes', 'A personalized training program', 'One guest pass every month', 'Monthly form checks with a coach'],
      },
      {
        name: 'Unlimited',
        desc: 'The full experience for serious athletes who want coaching, recovery, and one-on-one time.',
        features: ['Everything in the Premium plan', 'Two private personal-training sessions a month', 'Full recovery-room and mobility access', 'Nutrition guidance built for your goals', 'Bring a friend to any class, anytime', 'Priority booking on every class'],
      },
    ],
    compare: ['Open-gym access', 'Personal training sessions', 'Guest passes per month', 'Recovery-room access', 'Priority class booking'],
    faqs: [
      ['Can I freeze my membership?', 'Of course. Life gets busy, and travel or injury happens. You can freeze your membership for up to three months a year at no charge, and pick right back up where you left off whenever you are ready to train again.'],
      ['Is there a long-term contract?', 'No. Every membership is month-to-month, so you are never locked in. Cancel anytime with 30 days notice, no hoops and no hard feelings. We would rather earn your membership each month than trap you in a contract.'],
      ['Do you offer single-visit drop-ins?', 'We do. If you are visiting from out of town or just want to try us out, you can buy a single day pass and join any open-gym session or class. It is a low-pressure way to feel the gym before you commit to a plan.'],
    ],
  },
  wellness: {
    headline: 'Packages for the way you want to feel',
    subheadline: 'Whether you visit now and then or make wellness a weekly habit, there is a plan for you. Every package is flexible, easy to book, and free of long contracts or pressure.',
    meta: 'Flexible wellness packages for every routine. Compare the Essential, Signature, and Membership plans, then book your first visit and start feeling your best.',
    tiers: [
      {
        name: 'Essential',
        desc: 'A relaxed way to begin, for guests who like to book a treatment when the mood strikes.',
        features: ['One signature treatment each month', 'Online booking that takes seconds', 'Ten percent off any add-on service', 'A warm welcome for first-time guests'],
      },
      {
        name: 'Signature',
        desc: 'Our most-loved plan, for guests who make self-care a regular and rewarding habit.',
        features: ['Two signature treatments each month', 'Priority booking on the best time slots', 'Fifteen percent off all add-on services', 'One guest pass to share each month', 'A complimentary birthday treatment'],
      },
      {
        name: 'Membership',
        desc: 'The complete experience for guests who want the calm of a weekly wellness ritual.',
        features: ['Four signature treatments each month', 'First choice on every appointment', 'Twenty percent off all products and add-ons', 'Bring a guest to any visit, anytime', 'Free access to seasonal wellness events', 'Rollover for any unused treatments'],
      },
    ],
    compare: ['Signature treatments included', 'Priority booking', 'Add-on and product discount', 'Guest passes', 'Rollover of unused visits'],
    faqs: [
      ['How do I book my appointments?', 'It takes just a few seconds. Book online anytime from your phone or computer, choose the treatment and time that suit you, and you are set. Members get first pick of the calendar, so the best slots are yours before anyone else.'],
      ['What if I need to reschedule?', 'No problem at all. You can reschedule or cancel online up to 24 hours before your visit at no charge. We know plans change, so we keep it simple and never penalize you for taking care of the rest of your life.'],
      ['Do you offer gift cards?', 'We do, and they make a wonderful gift. Gift cards can be bought online in any amount and used toward treatments, packages, or products. There is no expiration to worry about, so your recipient can relax and redeem it whenever they like.'],
    ],
  },
};

// Meet-the-team band content — ROLE-BASED by design. We never fabricate named staff
// (the one thing generation must never invent), so this section presents credible ROLES
// + descriptions instead of people. Rendered by <TeamRoles> on the homepage; each entry
// is { head, intro, roles: [[title, desc] × 3] }. pack() always emits via `|| _default`
// so no vertical ever ships an unfilled {TEAM_*} token (distUnfilledTokens gate).
const TEAM = {
  medical: {
    head: 'The people who care for you',
    intro: 'Real clinicians and staff who know your name, listen closely, and treat your whole family with warmth.',
    roles: [
      ['Physicians & Providers', 'Board-certified doctors who listen first, explain in plain language, and treat the whole person, not just a symptom.'],
      ['Nursing & Clinical Care', 'A steady, compassionate care team who make every exam, lab, and follow-up feel calm and unhurried.'],
      ['Front Office & Patient Support', 'Friendly staff who make scheduling, insurance, and paperwork simple, so getting care is never a hassle.'],
    ],
  },
  dental: {
    head: 'The team behind every smile',
    intro: 'Gentle, judgment-free people who make dental visits easy for the whole family.',
    roles: [
      ['Dentists', 'Experienced dentists who explain every option clearly and keep your comfort first, always.'],
      ['Hygienists & Assistants', 'A gentle clinical team who make cleanings and treatments calm, quick, and genuinely pain-aware.'],
      ['Front Desk & Coordinators', 'Helpful staff who handle insurance, scheduling, and reminders so your visit is effortless.'],
    ],
  },
  wellness: {
    head: 'The people who guide your practice',
    intro: 'Certified teachers and a welcoming front desk who help every body feel at home on the mat.',
    roles: [
      ['Instructors', 'Certified teachers who guide you safely, meet you where you are, and adjust for every level.'],
      ['Wellness Coaches', 'Supportive coaches who help you build a steady practice and celebrate every small win.'],
      ['Studio & Front Desk', 'A warm team who greet you by name, set up your space, and keep the studio calm and clean.'],
    ],
  },
  fitness: {
    head: 'The coaches in your corner',
    intro: 'Certified coaches and staff who help you show up, lift safely, and get real results.',
    roles: [
      ['Head Coaches', 'Certified coaches who teach real technique, scale every lift, and keep you progressing safely.'],
      ['Personal Trainers', 'One-on-one trainers who build a plan around your goals and hold you to it, session after session.'],
      ['Front Desk & Member Support', 'A friendly team who handle sign-ups, scheduling, and everything that keeps your training on track.'],
    ],
  },
  legal: {
    head: 'Meet your legal team',
    intro: 'Experienced attorneys and staff who handle the details and the hard conversations for you.',
    roles: [
      ['Attorneys', 'Senior attorneys who handle your matter directly, explain your options, and fight for your outcome.'],
      ['Paralegals & Legal Staff', 'A meticulous team who keep filings, deadlines, and documents moving without a hitch.'],
      ['Client Intake & Support', 'Approachable staff who make the first call easy and keep you informed at every step.'],
    ],
  },
  restaurant: {
    head: 'The people behind the plates',
    intro: 'A from-scratch kitchen and a warm front-of-house team who treat every guest like family.',
    roles: [
      ['Chefs & Kitchen', 'Cooks who source local, make everything from scratch, and plate every dish with pride.'],
      ['Bar & Beverage', 'A craft team who pour thoughtful wine, beer, and house cocktails to match the menu.'],
      ['Hospitality & Service', 'A warm front-of-house crew who know the regulars and make every guest feel at home.'],
    ],
  },
  'local-service': {
    head: 'The pros who show up',
    intro: 'Licensed, insured technicians and staff who treat your home like their own.',
    roles: [
      ['Licensed Technicians', 'Credentialed pros who diagnose honestly, fix it right the first time, and respect your home.'],
      ['Project & Install Crew', 'A skilled crew who handle installs and upgrades to code, on time, and cleaned up when done.'],
      ['Dispatch & Customer Care', 'A responsive team who answer fast, give upfront pricing, and keep your appointment on schedule.'],
    ],
  },
  nonprofit: {
    head: 'The people who power the mission',
    intro: 'Dedicated staff and volunteers who turn your support into real impact in the community.',
    roles: [
      ['Program Team', 'Experienced staff who run our programs day to day and make sure help reaches the people who need it.'],
      ['Volunteers', 'Neighbors who give their time and heart, and make everything we do possible.'],
      ['Community & Outreach', 'A welcoming team who connect donors, partners, and families to the work and to each other.'],
    ],
  },
  'real-estate': {
    head: 'The people who guide your move',
    intro: 'Local agents and staff who know the market and look out for your best interests.',
    roles: [
      ['Agents & Advisors', 'Local experts who know every neighborhood and negotiate hard on your behalf.'],
      ['Transaction & Closing Team', 'A detail-driven team who keep contracts, inspections, and closings on track and stress-free.'],
      ['Client Care & Concierge', 'Friendly staff who answer questions fast and make every step of the move feel simple.'],
    ],
  },
  saas: {
    head: 'The team building your tools',
    intro: 'Engineers, designers, and support people obsessed with making the product genuinely useful.',
    roles: [
      ['Engineering', 'Builders who ship reliable, secure software and sweat the details users never have to see.'],
      ['Product & Design', 'A team who turn real problems into simple, delightful workflows that just make sense.'],
      ['Customer Success', 'Real humans who onboard you fast, answer quickly, and make sure you get value from day one.'],
    ],
  },
  retail: {
    head: 'The people behind the counter',
    intro: 'A friendly team who curate the shelves and help you find exactly what you need.',
    roles: [
      ['Buyers & Curators', 'Tastemakers who hand-pick every product for quality, value, and things you will actually love.'],
      ['Store & Floor Team', 'Helpful staff who know the stock, offer honest advice, and make shopping a pleasure.'],
      ['Customer Care', 'A responsive team who handle orders, returns, and questions with a smile.'],
    ],
  },
  agency: {
    head: 'The team behind the work',
    intro: 'Strategists, creatives, and builders who treat your goals like our own.',
    roles: [
      ['Strategy & Accounts', 'Partners who learn your business deeply and turn goals into a clear, measurable plan.'],
      ['Creative & Design', 'Makers who craft brand, story, and design that stands out and actually converts.'],
      ['Build & Delivery', 'A hands-on team who ship the work on time and sweat every last detail.'],
    ],
  },
  portfolio: {
    head: 'A little about how I work',
    intro: 'The craft, the process, and the values behind every project I take on.',
    roles: [
      ['Craft & Discipline', 'Years of focused practice poured into work that is thoughtful, polished, and built to last.'],
      ['Process', 'A clear, collaborative way of working that keeps projects calm, transparent, and on track.'],
      ['Values', 'Honest communication, real care for the details, and a genuine investment in your success.'],
    ],
  },
  _default: {
    head: 'The people behind the work',
    intro: 'A dedicated team who treat your goals like our own and sweat the details you should not have to.',
    roles: [
      ['Experienced Team', 'Seasoned professionals who bring real craft and genuine care to every project.'],
      ['Dedicated Support', 'Responsive people who answer fast, keep you informed, and make the whole process easy.'],
      ['Trusted Partners', 'A team who stand behind their work and are genuinely invested in your success.'],
    ],
  },
};

function pack(v) {
  const s = V[v];
  const o = {};
  const [hh, hs, hc, hsc] = s.hero;
  o.HERO_HEADLINE = hh; o.HERO_SUBHEADLINE = hs; o.HERO_CTA = hc; o.HERO_SECONDARY_CTA = hsc;
  s.badges.forEach((b, i) => { o[`TRUST_BADGE_${i + 1}`] = b; });
  s.features.forEach(([t, d], i) => { o[`FEATURE_${i + 1}_TITLE`] = t; o[`FEATURE_${i + 1}_DESCRIPTION`] = d; });
  o.SERVICES_HEADLINE = s.servicesHead[0]; o.SERVICES_SUBHEADLINE = s.servicesHead[1];
  s.services.forEach(([t, d], i) => { o[`SERVICE_${i + 1}_TITLE`] = t; o[`SERVICE_${i + 1}_FULL_DESCRIPTION`] = d; });
  o.SERVICES_CTA_HEADLINE = s.servicesCta[0]; o.SERVICES_CTA_DESCRIPTION = s.servicesCta[1];
  o.STATS_HEADLINE = s.statsHead;
  s.stats.forEach(([l, c], i) => { o[`STAT_${i + 1}_LABEL`] = l; o[`STAT_${i + 1}_CAPTION`] = c; });
  s.process.forEach(([t, d], i) => { o[`PROCESS_${i + 1}_TITLE`] = t; o[`PROCESS_${i + 1}_DESCRIPTION`] = d; });
  o.FAQ_HEADLINE = s.faqHead[0]; o.FAQ_SUBHEADLINE = s.faqHead[1];
  s.faqs.forEach(([q, a], i) => { o[`FAQ_${i + 1}_Q`] = q; o[`FAQ_${i + 1}_A`] = a; });
  o.CTA_HEADLINE = s.cta[0]; o.CTA_DESCRIPTION = s.cta[1]; o.CTA_BUTTON = s.cta[2];
  o.ABOUT_HEADLINE = s.about[0]; o.ABOUT_DESCRIPTION = s.about[1]; o.ABOUT_MISSION_HEADLINE = s.about[2]; o.ABOUT_MISSION_TEXT = s.about[3];
  o.ABOUT_META_DESCRIPTION = s.meta[0]; o.SERVICES_META_DESCRIPTION = s.meta[1];
  o.SEO_TAGLINE = TAGLINE[v] || '';
  o.SEO_DESCRIPTION = DESCRIPTION[v] || '';
  // Sub-page fill so /about and /faq are never empty: About-page intro paragraphs +
  // stats (stats reuse the homepage stats), FAQ page (general reuses the homepage
  // faqs; billing + support from SUBPAGE). journey 2026-08-25 — Brian: every page full.
  s.faqs.slice(0, 3).forEach(([q, a], i) => { o[`FAQ_GEN_${i + 1}_Q`] = q; o[`FAQ_GEN_${i + 1}_A`] = a; });
  s.stats.slice(0, 3).forEach(([val, lbl], i) => { o[`ABOUT_STAT_${i + 1}_VALUE`] = val; o[`ABOUT_STAT_${i + 1}_LABEL`] = lbl; });
  const sp = SUBPAGE[v];
  if (sp) {
    o.ABOUT_PARAGRAPH_1 = sp.aboutP[0]; o.ABOUT_PARAGRAPH_2 = sp.aboutP[1];
    sp.faqBill.forEach(([q, a], i) => { o[`FAQ_BILL_${i + 1}_Q`] = q; o[`FAQ_BILL_${i + 1}_A`] = a; });
    sp.faqSup.forEach(([q, a], i) => { o[`FAQ_SUP_${i + 1}_Q`] = q; o[`FAQ_SUP_${i + 1}_A`] = a; });
  }
  // Deep sub-page fill (journey 2026-08-26): 500+ words + several sections on
  // /about, /services, /contact, /faq for EVERY vertical. All tokens below are
  // rendered by the page components, so each MUST be emitted (distUnfilledTokens gate).
  const d = SUB2[v];
  if (d) {
    // About page — two more paragraphs, a 3-card values grid, an approach band.
    o.ABOUT_PARAGRAPH_3 = d.aboutP34[0];
    o.ABOUT_PARAGRAPH_4 = d.aboutP34[1];
    d.values.forEach(([t, x], i) => { o[`ABOUT_VALUE_${i + 1}_TITLE`] = t; o[`ABOUT_VALUE_${i + 1}_DESC`] = x; });
    o.ABOUT_APPROACH_TITLE = d.approach[0];
    o.ABOUT_APPROACH_TEXT = d.approach[1];
    // Services page — intro, six ~80-word service write-ups, a 3-card why-us band.
    o.SERVICES_INTRO = d.servicesIntro;
    d.serviceLong.forEach((txt, i) => { o[`SERVICE_${i + 1}_LONG_DESCRIPTION`] = txt; });
    d.why.forEach(([t, x], i) => { o[`SERVICES_WHY_${i + 1}_TITLE`] = t; o[`SERVICES_WHY_${i + 1}_DESC`] = x; });
    // Contact page — a reassuring intro paragraph above the form.
    o.CONTACT_INTRO = d.contactIntro;
    // FAQ page — four extra general Q&A (→ 10-12 total items with the existing sets).
    d.faqMore.forEach(([q, a], i) => { o[`FAQ_MORE_${i + 1}_Q`] = q; o[`FAQ_MORE_${i + 1}_A`] = a; });
  }
  // About page — promise band + closing sign-off band to clear 500+ words.
  const ap = ABOUT_PROMISE[v];
  if (ap) { o.ABOUT_PROMISE_TITLE = ap[0]; o.ABOUT_PROMISE_TEXT = ap[1]; }
  const ac = ABOUT_CLOSE[v];
  if (ac) { o.ABOUT_CLOSING_HEADLINE = ac[0]; o.ABOUT_CLOSING_TEXT = ac[1]; }
  // Contact page — reassurance paragraph + 3 "ways to reach us" cards + closing help band.
  const ce = CONTACT_EXTRA[v];
  if (ce) {
    o.CONTACT_REASSURE = ce.reassure;
    ce.points.forEach(([t, x], i) => { o[`CONTACT_POINT_${i + 1}_TITLE`] = t; o[`CONTACT_POINT_${i + 1}_DESC`] = x; });
  }
  const ch = CONTACT_HELP[v];
  if (ch) { o.CONTACT_HELP_TITLE = ch[0]; o.CONTACT_HELP_TEXT = ch[1]; }
  // Contact page HEAD — H1 + subheadline + meta (were unemitted → empty <h1>).
  const chd = CONTACT_HEAD[v] || CONTACT_HEAD._default;
  o.CONTACT_HEADLINE = chd[0];
  o.CONTACT_SUBHEADLINE = chd[1];
  o.CONTACT_META_DESCRIPTION = chd[2];
  // FAQ page — two more general Q&A (→ 12-13 items total, 500+ words).
  const fm2 = FAQ_MORE2[v];
  if (fm2) fm2.forEach(([q, a], i) => { o[`FAQ_MORE_${i + 5}_Q`] = q; o[`FAQ_MORE_${i + 5}_A`] = a; });
  const img = IMG[v];
  if (img) {
    o.HERO_IMAGE_URL = img.hero;
    o.HERO_IMAGE_ALT = HERO_ALT[v] || 'A welcoming, professional space';
    o.ABOUT_IMAGE_URL = img.about;
    o.ABOUT_IMAGE_ALT = img.aboutAlt;
  }
  const feats = FEATURE_IMG[v] || [];
  for (let i = 0; i < 6; i++) if (feats[i]) o[`FEATURE_${i + 1}_IMAGE_URL`] = feats[i];
  const gal = GALLERY_IMG[v] || [];
  if (gal.length) o.GALLERY_HEADLINE = GALLERY_HEADLINE[v] || 'Gallery';
  // 8 (was 6): the Home masonry is lg:columns-4 — 6 photos left 2 empty slots,
  // 8 fills a clean 4×2. Pairs with the 8-slot galleryImages array in Home.tsx.
  for (let i = 0; i < 8; i++) if (gal[i]) {
    o[`GALLERY_${i + 1}_IMAGE_URL`] = gal[i].src;
    o[`GALLERY_${i + 1}_IMAGE_ALT`] = gal[i].alt;
  }
  // Meet-the-team band (role-based, never named people). Always emitted via `|| _default`
  // so the homepage <TeamRoles> section never ships an unfilled {TEAM_*} token.
  const tm = TEAM[v] || TEAM._default;
  o.TEAM_HEADLINE = tm.head;
  o.TEAM_INTRO = tm.intro;
  tm.roles.forEach(([t, x], i) => { o[`TEAM_ROLE_${i + 1}_TITLE`] = t; o[`TEAM_ROLE_${i + 1}_DESC`] = x; });
  // Pricing page — only emitted for verticals that render /pricing (features.pricing
  // true: saas, fitness, wellness). Tier feature counts match src/pages/Pricing.tsx
  // exactly (Starter 4, Pro 5, Enterprise 6). Every token below is rendered by the
  // page, so all MUST be emitted or the page ships thin (distUnfilledTokens gate).
  const pr = PRICING[v];
  if (pr) {
    o.PRICING_HEADLINE = pr.headline;
    o.PRICING_SUBHEADLINE = pr.subheadline;
    o.PRICING_META_DESCRIPTION = pr.meta;
    pr.tiers.forEach((t, i) => {
      o[`TIER_${i + 1}_NAME`] = t.name;
      o[`TIER_${i + 1}_DESC`] = t.desc;
      t.features.forEach((f, j) => { o[`TIER_${i + 1}_F${j + 1}`] = f; });
    });
    pr.compare.forEach((f, i) => { o[`COMPARE_${i + 1}_FEATURE`] = f; });
    pr.faqs.forEach(([q, a], i) => { o[`PRICING_FAQ_${i + 1}_Q`] = q; o[`PRICING_FAQ_${i + 1}_A`] = a; });
  }
  return o;
}

let count = 0;
for (const v of Object.keys(V)) {
  const file = path.join(OUT, `_content.${v}.json`);
  fs.writeFileSync(file, JSON.stringify(pack(v), null, 2) + '\n');
  count++;
  console.log(`wrote _content.${v}.json (${Object.keys(pack(v)).length} tokens)`);
}
console.log(`\n${count} content packs generated.`);
