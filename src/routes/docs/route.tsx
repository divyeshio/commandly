import { docsNav } from "@/components/docs/nav";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/docs")({
  component: DocsLayout,
});

function DocsLayout() {
  return (
    <SidebarProvider
      className="mt-16 overflow-hidden border-t border-muted"
      style={{ height: "calc(100svh - 4rem)", minHeight: "calc(100svh - 4rem)" }}
    >
      <Sidebar collapsible="none">
        <SidebarContent className="p-2">
          {docsNav.map((section, i) => (
            <SidebarGroup key={i}>
              {section.section && <SidebarGroupLabel>{section.section}</SidebarGroupLabel>}
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton asChild>
                        <Link
                          resetScroll={true}
                          preload="intent"
                          to="/docs/$componentName"
                          params={{ componentName: item.name }}
                          activeProps={{
                            className: "bg-sidebar-accent font-medium",
                          }}
                          activeOptions={{ exact: true }}
                        >
                          {item.title}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <ScrollArea className="h-full">
          <Outlet />
        </ScrollArea>
      </SidebarInset>
    </SidebarProvider>
  );
}
