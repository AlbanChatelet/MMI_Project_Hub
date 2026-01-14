<script setup>
import AppHeader from '@/components/AppHeader.vue'
import { ref, onMounted, computed } from "vue";
import { pb } from "../pb";
import { RouterLink, useRouter } from 'vue-router';

const router = useRouter();

const user = ref(pb.authStore.model);
const promotion = ref(null);
const groupes = ref([]);
const promotionsById = ref({});

const loading = ref(true);
const error = ref(null);

// ✅ DÉCONNEXION
const logout = () => {
  pb.authStore.clear();
  user.value = null;
  router.push("/login"); // adapte si besoin
};

// --- LOGIQUE MODALE D'ÉDITION ---
const isEditModalOpen = ref(false);
const isUpdating = ref(false);
const editForm = ref({
  name: "",
  username: "",
  avatar: null,
  avatarPreview: null,
});

const openEditModal = () => {
  editForm.value = {
    name: user.value?.name || "",
    username: user.value?.username || "",
    avatar: null,
    avatarPreview: null,
  };
  isEditModalOpen.value = true;
};

const onAvatarChange = (e) => {
  const file = e?.target?.files?.[0] || null;
  editForm.value.avatar = file;

  if (editForm.value.avatarPreview) {
    URL.revokeObjectURL(editForm.value.avatarPreview);
    editForm.value.avatarPreview = null;
  }
  if (file) {
    editForm.value.avatarPreview = URL.createObjectURL(file);
  }
};

const closeEditModal = () => {
  if (editForm.value.avatarPreview) {
    URL.revokeObjectURL(editForm.value.avatarPreview);
  }
  isEditModalOpen.value = false;
};

const handleUpdateProfile = async () => {
  isUpdating.value = true;
  try {
    if (editForm.value.avatar) {
      const fd = new FormData();
      fd.append("name", editForm.value.name);
      fd.append("username", editForm.value.username);
      fd.append("avatar", editForm.value.avatar);

      const record = await pb.collection("users").update(user.value.id, fd);
      user.value = record;
    } else {
      const record = await pb.collection("users").update(user.value.id, {
        name: editForm.value.name,
        username: editForm.value.username,
      });
      user.value = record;
    }

    pb.authStore.save(pb.authStore.token, user.value);
    closeEditModal();
  } catch (e) {
    console.error(e);
    alert("Erreur lors de la mise à jour : " + (e?.message || e));
  } finally {
    isUpdating.value = false;
  }
};

// --- FILTRES ---
const selectedAnnee = ref("");
const selectedParcours = ref("");

const parcoursLabel = (parcours) => {
  const map = { dev: "Développement", "créa": "Design", crea: "Design", com: "Communication" };
  return map[parcours] || parcours;
};

const anneeLabelText = (annee) => {
  const a = String(annee);
  if (a === "1") return "1ère année";
  if (a === "2") return "2ème année";
  if (a === "3") return "3ème année";
  return `${a}ème année`;
};

const projetPhotoUrl = (projet) => {
  if (!projet?.photo) return null;
  return pb.files.getURL(projet, projet.photo);
};

const avatarUrl = computed(() => {
  if (!user.value?.avatar) return null;
  return pb.files.getURL(user.value, user.value.avatar);
});

const avatarPreviewUrl = computed(() => {
  return editForm.value.avatarPreview || avatarUrl.value || null;
});

const promotionLabel = computed(() => {
  if (!promotion.value) return null;
  const promoRange = promotion.value.promo;
  const annee = promotion.value.annee;
  const parcours = promotion.value.parcours;
  const line = `${anneeLabelText(annee)} - ${parcoursLabel(parcours)}`;
  return promoRange ? `${promoRange} • ${line}` : line;
});

onMounted(async () => {
  try {
    if (!pb.authStore.isValid || !pb.authStore.model?.id) {
      throw new Error("Utilisateur non connecté");
    }

    user.value = await pb.collection("users").getOne(pb.authStore.model.id);

    if (user.value.promotion) {
      promotion.value = await pb.collection("Promotion").getOne(user.value.promotion);
    }

    groupes.value = await pb.collection("Groupe").getFullList({
      filter: `membres ?~ "${user.value.id}"`,
      expand: "projet",
      sort: "created",
    });

    const promoIds = new Set();
    for (const g of groupes.value) {
      const p = g?.expand?.projet;
      if (!p) continue;
      const rel = p.promo;
      if (Array.isArray(rel)) rel.forEach((id) => promoIds.add(id));
      else if (typeof rel === "string" && rel) promoIds.add(rel);
    }

    if (promoIds.size > 0) {
      const ids = Array.from(promoIds);
      const filter = ids.map((id) => `id="${id}"`).join(" || ");
      const promos = await pb.collection("Promotion").getFullList({
        filter,
        fields: "id,parcours,annee,promo,presentable",
      });
      const map = {};
      for (const pr of promos) map[pr.id] = pr;
      promotionsById.value = map;
    }
  } catch (e) {
    console.error(e);
    error.value = e.message || "Erreur lors du chargement";
  } finally {
    loading.value = false;
  }
});

const projetsDuUser = computed(() => {
  const map = new Map();
  for (const g of groupes.value) {
    const p = g?.expand?.projet;
    if (!p?.id) continue;

    const promoRel = Array.isArray(p.promo) ? p.promo : p.promo ? [p.promo] : [];
    const yearsSet = new Set();
    const tracksSet = new Set();
    const rawPromo = [];

    for (const promoId of promoRel) {
      const pr = promotionsById.value[promoId];
      if (!pr) continue;
      const a = pr.annee != null ? String(pr.annee) : "";
      const t = pr.parcours != null ? String(pr.parcours) : "";
      if (a) yearsSet.add(a);
      if (t) tracksSet.add(t);
      rawPromo.push({ annee: a, parcours: t });
    }

    const payload = {
      projet: p,
      years: Array.from(yearsSet).sort(),
      tracks: Array.from(tracksSet),
      rawPromo,
    };

    if (!map.has(p.id)) map.set(p.id, payload);
    else {
      const ex = map.get(p.id);
      ex.years = Array.from(new Set([...ex.years, ...payload.years])).sort();
      ex.tracks = Array.from(new Set([...ex.tracks, ...payload.tracks]));
      ex.rawPromo = [...ex.rawPromo, ...payload.rawPromo];
      map.set(p.id, ex);
    }
  }
  return Array.from(map.values());
});

const projetsFiltres = computed(() => {
  const annee = selectedAnnee.value || "";
  const parcours = selectedParcours.value || "";
  if (!annee && !parcours) return projetsDuUser.value;

  return projetsDuUser.value.filter((item) =>
    item.rawPromo.some((rp) => {
      const okA = annee ? rp.annee === annee : true;
      const okP = parcours ? rp.parcours === parcours : true;
      return okA && okP;
    })
  );
});

const yearBadge = (y) => anneeLabelText(y);
const trackBadge = (t) => parcoursLabel(t);
const displayName = computed(() => user.value?.name || user.value?.username || "Utilisateur");
</script>



<template>
  <AppHeader />

  <div class="min-h-screen bg-[#151A24] text-white">
    <div class="max-w-6xl mx-auto px-6 py-10">
      <p v-if="loading" class="text-white/70">Chargement...</p>
      <p v-else-if="error" class="text-red-300">{{ error }}</p>

      <template v-else>
        <div class="flex items-center gap-6">
          <div class="relative">
            <img
              v-if="avatarUrl"
              :src="avatarUrl"
              class="w-24 h-24 rounded-full object-cover border border-white/10"
            />
            <div
              v-else
              class="w-24 h-24 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-3xl font-bold"
            >
              {{ displayName.charAt(0).toUpperCase() }}
            </div>

            <button
              @click="openEditModal"
              class="absolute -top-1 -left-1 w-9 h-9 rounded-full bg-[#CFFFBC] text-black flex items-center justify-center shadow"
            >
              ✎
            </button>
          </div>

          <div class="flex-1 flex items-start justify-between gap-4">
            <div>
              <h1 class="text-4xl font-extrabold text-white/80">
                {{ displayName }}
              </h1>
              <p class="text-white/60 mt-1">
                {{ promotionLabel || "Promotion non renseignée" }}
              </p>
            </div>

            <!-- ✅ BOUTON DÉCONNEXION -->
            <button
              @click="logout"
              class="px-5 py-2 rounded-full bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition"
            >
              Se déconnecter
            </button>
          </div>
        </div>

        <div class="mt-14">
          <h2 class="text-5xl font-extrabold">Mes projets</h2>

          <div class="mt-6 flex flex-wrap items-center gap-4">
            <div class="relative">
              <select
                v-model="selectedAnnee"
                class="appearance-none bg-[#CFFFBC] text-black font-medium rounded-full px-5 py-2 pr-10 shadow"
              >
                <option value="">Toutes années</option>
                <option value="1">1ère année</option>
                <option value="2">2ème année</option>
                <option value="3">3ème année</option>
              </select>
              <span class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-black/70">⌄</span>
            </div>

            <div class="relative">
              <select
                v-model="selectedParcours"
                class="appearance-none bg-[#CFFFBC] text-black font-medium rounded-full px-5 py-2 pr-10 shadow"
              >
                <option value="">Tous parcours</option>
                <option value="dev">Développement</option>
                <option value="créa">Design</option>
                <option value="com">Communication</option>
              </select>
              <span class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-black/70">⌄</span>
            </div>

            <button
              @click="selectedAnnee = ''; selectedParcours = ''"
              class="ml-2 text-[#CFFFBC] text-sm hover:underline"
            >
              Réinitialiser
            </button>
          </div>

          <div class="mt-8">
            <div v-if="projetsFiltres.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <RouterLink
                v-for="item in projetsFiltres"
                :key="item.projet.id"
                :to="`/projets/${item.projet.id}`"
                class="group relative rounded-3xl overflow-hidden bg-black/40 border border-white/10 shadow-xl"
              >
                <img
                  v-if="projetPhotoUrl(item.projet)"
                  :src="projetPhotoUrl(item.projet)"
                  class="w-full h-56 object-cover opacity-80 group-hover:opacity-95 transition"
                />
                <div v-else class="w-full h-56 bg-white/5 flex items-center justify-center text-white/40">
                  Pas de photo
                </div>

                <div class="absolute top-4 left-4 flex gap-2">
                  <span
                    v-if="item.years.length"
                    class="text-xs font-semibold px-3 py-1 rounded-full bg-[#CFFFBC] text-black"
                  >
                    {{ yearBadge(item.years[item.years.length - 1]) }}
                  </span>
                  <span class="text-xs font-semibold px-3 py-1 rounded-full bg-[#CFFFBC] text-black">
                    Collectif
                  </span>
                </div>

                <div class="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/90 to-transparent">
                  <h3 class="text-2xl font-extrabold text-[#CFFFBC]">
                    {{ item.projet.titre || "(Sans titre)" }}
                  </h3>
                  <div class="mt-2 flex flex-wrap gap-2">
                    <span
                      v-for="t in item.tracks"
                      :key="t"
                      class="text-[10px] px-2 py-1 rounded-full bg-white/10 border border-white/15 text-white/80"
                    >
                      {{ trackBadge(t) }}
                    </span>
                  </div>
                </div>
              </RouterLink>
            </div>

            <p v-else class="text-white/60 mt-6">Aucun projet trouvé.</p>
          </div>
        </div>
      </template>
    </div>

    <Teleport to="body">
      <div v-if="isEditModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="closeEditModal"></div>

        <div class="relative bg-[#1A1F2B] border border-white/10 w-full max-w-md rounded-3xl p-8 shadow-2xl">
          <h2 class="text-2xl font-bold mb-6 text-[#CFFFBC]">Modifier mon profil</h2>

          <form @submit.prevent="handleUpdateProfile" class="space-y-5">
            <!-- ✅ Avatar -->
            <div>
              <label class="block text-sm text-white/60 mb-2">Photo de profil</label>

              <div class="flex items-center gap-4">
                <div class="w-16 h-16 rounded-full overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center">
                  <img
                    v-if="avatarPreviewUrl"
                    :src="avatarPreviewUrl"
                    alt="Aperçu avatar"
                    class="w-full h-full object-cover"
                  />
                  <span v-else class="text-xl font-bold text-white/60">
                    {{ displayName.charAt(0).toUpperCase() }}
                  </span>
                </div>

                <label class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition cursor-pointer">
                  <span class="text-sm text-white/80 font-medium">Choisir un fichier</span>
                  <input
                    type="file"
                    accept="image/*"
                    class="hidden"
                    @change="onAvatarChange"
                  />
                </label>
              </div>

              <p class="mt-2 text-xs text-white/50">
                Formats image (jpg/png/webp). L’avatar sera enregistré dans le champ <span class="text-white/70">avatar</span>.
              </p>
            </div>

            <div>
              <label class="block text-sm text-white/60 mb-2">Nom complet</label>
              <input
                v-model="editForm.name"
                type="text"
                required
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#CFFFBC] outline-none transition"
              />
            </div>

            <div>
              <label class="block text-sm text-white/60 mb-2">Nom d'utilisateur</label>
              <input
                v-model="editForm.username"
                type="text"
                required
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#CFFFBC] outline-none transition"
              />
            </div>

            <div class="flex gap-3 mt-8">
              <button
                type="button"
                @click="closeEditModal"
                class="flex-1 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition font-medium"
              >
                Annuler
              </button>
              <button
                type="submit"
                :disabled="isUpdating"
                class="flex-1 px-6 py-3 rounded-xl bg-[#CFFFBC] text-black font-bold hover:bg-[#E4FFD4] transition disabled:opacity-50"
              >
                {{ isUpdating ? 'Enregistrement...' : 'Enregistrer' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

