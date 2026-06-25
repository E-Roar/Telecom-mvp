/* eslint-disable @typescript-eslint/no-explicit-any */
 
 
import { ZONES } from "./types";
import type { Client, WorkOrder, Technician } from "./types";

function avatarUri(initial: string, color: string): string {
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="16" fill="${color}"/><text x="40" y="50" text-anchor="middle" fill="white" font-size="32" font-weight="600" font-family="Inter,sans-serif">${initial}</text></svg>`)}`;
}

const TECH_DATA: { name: string; email: string; phone: string; zones: string[]; color: string; lat: number; lng: number }[] = [
  { name: "KERROUMI Abderrahman", email: "kerroumi@ftth.ma", phone: "212600100001", zones: [ZONES[0], ZONES[12]], color: "#16a34a", lat: 33.5450, lng: -7.6330 },
  { name: "ADAM El Ariki", email: "adam@ftth.ma", phone: "212600100002", zones: [ZONES[1], ZONES[13]], color: "#2563eb", lat: 33.5600, lng: -7.6150 },
  { name: "HASSAN Benmoussa", email: "hassan@ftth.ma", phone: "212600100003", zones: [ZONES[2], ZONES[14]], color: "#ea580c", lat: 33.5520, lng: -7.6280 },
  { name: "YOUSSEF El Idrissi", email: "youssef@ftth.ma", phone: "212600100004", zones: [ZONES[3], ZONES[15]], color: "#7c3aed", lat: 33.5750, lng: -7.6400 },
  { name: "MOHAMED Alaoui", email: "mohamed@ftth.ma", phone: "212600100005", zones: [ZONES[4], ZONES[16]], color: "#0891b2", lat: 33.5350, lng: -7.6500 },
  { name: "SAID Bouziane", email: "said@ftth.ma", phone: "212600100006", zones: [ZONES[5], ZONES[17]], color: "#d97706", lat: 33.5800, lng: -7.6100 },
  { name: "HAMZA Tech", email: "tech@ftth.ma", phone: "212600100007", zones: [ZONES[6], ZONES[18]], color: "#22c55e", lat: 33.5650, lng: -7.6050 },
];

const CLIENT_DATA: { name: string; phone1: string; phone2: string; address: string; city: string; zone: string; status: string; notes: string; wotNumber: string; lat: number; lng: number }[] = [
  { name: "MOHAMED TABBAK", phone1: "212659549501", phone2: "212659549502", address: "AL MOUSTAKBAL IMM A 301 SIDI MAAROUF", city: "CASABLANCA", zone: "CAS-ALMOSTAKBAL-01", status: "Livré", notes: "Client prioritaire fibre", wotNumber: "WOT1815001", lat: 33.5350, lng: -7.6433 },
  { name: "ASMAA DAOUI", phone1: "212661638659", phone2: "", address: "LAMELLIA 2 IMM 14 APP 3", city: "CASABLANCA", zone: "CAS-LAMELLIA 2", status: "En cours", notes: "Relance client SGP", wotNumber: "WOT1815002", lat: 33.5510, lng: -7.6045 },
  { name: "YOUSSEF AIT LHAJ", phone1: "212665261994", phone2: "212665261995", address: "HAY MY ABDELLAH 06 RUE 74 NR 32", city: "CASABLANCA", zone: "CAS-LAMELIA", status: "Livré", notes: "FAT OK", wotNumber: "WOT1815003", lat: 33.5550, lng: -7.6080 },
  { name: "SIHAM DENDAN", phone1: "212702448972", phone2: "", address: "HAY MY ABDELLAH RUE 198 NR 32 AIN CHOK I", city: "CASABLANCA", zone: "CAS-INARA 1", status: "En attente", notes: "Client absent 2 fois", wotNumber: "WOT1815004", lat: 33.5620, lng: -7.6100 },
  { name: "KARIM ORGI", phone1: "212702375950", phone2: "212702375951", address: "RUE 84 NR 05 PLAQUE AIN CHOK", city: "CASABLANCA", zone: "CAS-AIN CHOK Z1", status: "Livré", notes: "Installation JARETIERE", wotNumber: "WOT1815005", lat: 33.5480, lng: -7.6110 },
  { name: "NAIMA BENZIANE", phone1: "212661234567", phone2: "212661234568", address: "BD ZERKTOUNI RÉS ALIA APP 8", city: "CASABLANCA", zone: "CAS-HABOUS", status: "En cours", notes: "Attente matériel SLIMBOX", wotNumber: "WOT1815006", lat: 33.5660, lng: -7.6230 },
  { name: "ABDELKRIM FASSI", phone1: "212665678901", phone2: "", address: "RUE 45 NR 12 HAY MOHAMMADI", city: "CASABLANCA", zone: "CAS-AIN CHOK Z1", status: "Annulé", notes: "Client a refusé le passage", wotNumber: "WOT1815007", lat: 33.5550, lng: -7.6190 },
  { name: "FATIMA ZAHRA", phone1: "212702111222", phone2: "212702111223", address: "RÉS TANJA IMM C APP 5 RUE 94", city: "CASABLANCA", zone: "CAS-AIN CHOK Z2 SIDI", status: "Livré", notes: "CABLE tiré OK", wotNumber: "WOT1815008", lat: 33.5330, lng: -7.6180 },
  { name: "HASSAN OUMLIL", phone1: "212659333444", phone2: "", address: "QUARTIER AL AMAL IMM 7 APP 12", city: "CASABLANCA", zone: "CAS-HABOUS", status: "Injoignable", notes: "Tél ne répond plus, 3 tentatives", wotNumber: "WOT1815009", lat: 33.5700, lng: -7.6350 },
  { name: "SAMIRA BOUCHTA", phone1: "212661555666", phone2: "212661555667", address: "RUE AL MOUKAWAMA NR 8", city: "CASABLANCA", zone: "CAS-ALMOSTAKBAL-01", status: "Planifié", notes: "RDV pris 14/06", wotNumber: "WOT1815010", lat: 33.5380, lng: -7.6480 },
  { name: "DRISS CHRAIBI", phone1: "212600111222", phone2: "", address: "IMM AL FATH APP 15 BD MED V", city: "CASABLANCA", zone: "CAS-BOURGOGNE", status: "Livré", notes: "FAT + JARETIERE OK", wotNumber: "WOT1815011", lat: 33.5780, lng: -7.6200 },
  { name: "AMAL BENNANI", phone1: "212702333444", phone2: "212702333445", address: "HÔTEL DE VILLE RUE 88 NR 22", city: "CASABLANCA", zone: "CAS-AIN CHOK Z2 SIDI", status: "En cours", notes: "Configuration ONT effectuée", wotNumber: "WOT1815012", lat: 33.5400, lng: -7.6250 },
];

export function seedDatabase(db: any) {
  const techs = TECH_DATA.map((t, i) =>
    db.create("technicians", {
      name: t.name,
      email: t.email,
      phone: t.phone,
      avatar: avatarUri(t.name.charAt(0) + (t.name.includes(" ") ? t.name.split(" ")[1].charAt(0) : ""), t.color),
      rating: 4 + Math.round(Math.random() * 10) / 10,
      zones: t.zones,
      activeWots: 0,
      completedWots: 0,
      lat: t.lat,
      lng: t.lng,
    })
  );

  const clients = CLIENT_DATA.map((c) =>
    db.create("clients", {
      name: c.name,
      phone1: c.phone1,
      phone2: c.phone2,
      address: c.address,
      city: c.city,
      zone: c.zone,
      status: c.status,
      notes: c.notes,
      wotNumber: c.wotNumber,
    })
  );

  const statuses: string[] = ["new", "assigned", "in_progress", "completed", "cancelled"];
  const interventions = ["FAT", "JARETIERE", "CABLE", "SLIMBOX", "CONFIGURATION_ONT"];

  for (let i = 0; i < 35; i++) {
    const client = clients[i % clients.length];
    const cd = CLIENT_DATA[i % clients.length];
    const tech = techs[i % techs.length];
    const s = statuses[i % statuses.length];
    const now = Date.now();

    db.create("workOrders", {
      wotNumber: `WOT181${5000 + i}`,
      clientId: client.id,
      clientName: client.name,
      clientPhone: client.phone1,
      technicianId: tech.id,
      technicianName: tech.name,
      status: s,
      zone: client.zone,
      address: client.address,
      city: client.city,
      phone1: client.phone1,
      phone2: client.phone2,
      notes: client.notes,
      photos: [],
      category: i % 4 === 0 ? "SAV" : "RACC",
      interventionType: interventions[i % interventions.length],
      scheduledDate: now + (i % 7 - 3) * 86400000,
      lat: cd.lat,
      lng: cd.lng,
    });
  }

  techs.forEach((t: any) => {
    const assigned = db.getAll("workOrders").filter((w: WorkOrder) => w.technicianId === t.id);
    const actives = assigned.filter((w: WorkOrder) => !["completed", "cancelled"].includes(w.status));
    const completedCount = assigned.filter((w: WorkOrder) => w.status === "completed").length;
    db.update("technicians", t.id, { activeWots: actives.length, completedWots: completedCount });
  });

  const prompts = [
    { title: "Anomalies du jour", prompt: "Affiche toutes les WOTs anomales (annulées, refusées, injoignables) aujourd'hui.", tags: [], usageCount: 15 },
    { title: "Rapport hebdomadaire", prompt: "Génère le rapport PDF hebdomadaire pour toutes les WOTs réalisées.", tags: [], usageCount: 8 },
    { title: "Vue carte", prompt: "Affiche la carte avec uniquement les WOTs en attente et planifiées.", tags: [], usageCount: 5 },
  ];
  prompts.forEach((p) => db.create("savedPrompts", p));

  console.log("MockDB seeding complete.");
}
