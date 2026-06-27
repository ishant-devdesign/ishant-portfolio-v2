import { SiteShell } from "@/components/layout/site-shell";
import { SiteFooter } from "@/components/layout/site-footer";
import { PetsPageShell } from "@/components/pets/pets-page-shell";
import { getLivePets } from "@/lib/content";

export default async function PetsPage() {
  const pets = await getLivePets();

  return (
    <SiteShell>
      <PetsPageShell initialPets={pets} />
      <SiteFooter />
    </SiteShell>
  );
}
