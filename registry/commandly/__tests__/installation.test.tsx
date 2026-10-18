import { InstallationSection } from "../installation";
import type { Installation } from "@/components/commandly/types/tool";
import { fireEvent, render, screen, within } from "@testing-library/react";

const installation: Installation = {
  sources: [
    {
      key: "go-install",
      method: "package_manager",
      manager: "go",
      command: "go install -v github.com/projectdiscovery/httpx/cmd/httpx@latest",
      url: "https://docs.projectdiscovery.io/opensource/httpx/install",
    },
    {
      key: "brew",
      method: "package_manager",
      manager: "brew",
      command: "brew install httpx",
      os: ["linux", "macos"],
    },
    {
      key: "docker",
      method: "docker",
      command: "docker pull projectdiscovery/httpx:latest",
      note: "Pulls the latest published image.",
    },
  ],
};

const tabLabels = () => screen.getAllByRole("tab").map((tab) => tab.textContent);

/** Radix activates a tab on mouse down, which `fireEvent.click` alone does not dispatch. */
const selectTab = (label: string) => {
  const tab = screen.getAllByRole("tab").find((candidate) => candidate.textContent === label);
  fireEvent.mouseDown(tab!);
};

describe("InstallationSection", () => {
  it("renders nothing when installation is undefined", () => {
    const { container } = render(<InstallationSection />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when the tool has no sources", () => {
    const { container } = render(<InstallationSection installation={{ sources: [] }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders each installation source grouped by method", () => {
    render(<InstallationSection installation={installation} />);

    expect(screen.getByText("Installation")).toBeInTheDocument();
    expect(screen.getByText("Package manager")).toBeInTheDocument();
    expect(screen.getByText("Docker")).toBeInTheDocument();
    expect(
      screen.getByText("go install -v github.com/projectdiscovery/httpx/cmd/httpx@latest"),
    ).toBeInTheDocument();
    expect(screen.getByText("docker pull projectdiscovery/httpx:latest")).toBeInTheDocument();
  });

  it("tabs between the sources of one method and shows the first by default", () => {
    render(<InstallationSection installation={installation} />);

    const tabs = screen.getAllByRole("tab");
    expect(tabLabels()).toEqual(["go", "brew"]);
    expect(tabs[0]).toHaveAttribute("data-state", "active");
    expect(screen.queryByText("brew install httpx")).not.toBeInTheDocument();

    fireEvent.mouseDown(tabs[1]);

    expect(screen.getByText("brew install httpx")).toBeInTheDocument();
  });

  it("renders a method with a single source without tabs", () => {
    render(<InstallationSection installation={installation} />);

    const docker = screen.getByText("Docker").closest("section")!;
    expect(within(docker).queryAllByRole("tab")).toHaveLength(0);
    expect(
      within(docker).getByText("docker pull projectdiscovery/httpx:latest"),
    ).toBeInTheDocument();
  });

  it("labels a source with no manager by its key", () => {
    render(
      <InstallationSection
        installation={{
          sources: [
            { key: "release-binary-curl", method: "binary", command: "curl --version" },
            { key: "release-binary-wget", method: "binary", command: "wget --version" },
          ],
        }}
      />,
    );

    expect(tabLabels()).toEqual(["Release binary curl", "Release binary wget"]);
  });

  it("does not render the declared platforms", () => {
    render(<InstallationSection installation={installation} />);

    selectTab("brew");

    expect(screen.queryByText("linux")).not.toBeInTheDocument();
    expect(screen.queryByText("macos")).not.toBeInTheDocument();
  });

  it("renders the documentation link and note for a source", () => {
    render(<InstallationSection installation={installation} />);

    expect(screen.getByText("Installation docs")).toBeInTheDocument();
    expect(screen.getByText("Pulls the latest published image.")).toBeInTheDocument();
  });

  it("renders a copy button for every source", () => {
    render(<InstallationSection installation={installation} />);

    expect(screen.getByRole("button", { name: /copy go-install command/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /copy docker command/i })).toBeInTheDocument();

    selectTab("brew");

    expect(screen.getByRole("button", { name: /copy brew command/i })).toBeInTheDocument();
  });
});
