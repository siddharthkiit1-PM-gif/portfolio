import { PostFilmHero } from "@/components/preview/PostFilmHero";

/**
 * /preview — prototype route for the post-cinematic hero rewrite.
 *
 * Lives outside the live homepage so we can iterate on the layout without
 * touching the deployed site. Once approved, the prototype graduates into
 * components/home/Hero.tsx and this route is retired.
 */
export default function PreviewPage() {
  return <PostFilmHero />;
}
