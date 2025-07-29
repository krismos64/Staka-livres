import LandingPage from "@/pages/LandingPage";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";

// Mock minimal du composant Packs pour exposer un bouton testable
describe("LandingPage", () => {
  it("clicking a pack navigates to guest order form with slug", async () => {
    const user = userEvent.setup();
    const router = createMemoryRouter(
      [{ path: "/", element: <LandingPage /> }],
      { initialEntries: ["/"] }
    );
    render(<RouterProvider router={router} />);

    // On suppose qu'une carte a data-testid="pack-premium"
    await user.click(await screen.findByTestId("pack-premium"));

    expect(router.state.location.pathname).toBe("/commande-invitee");
    expect(router.state.location.search).toBe("?pack=premium");
  });
});
