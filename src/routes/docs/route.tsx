import { docsNav } from "@/components/docs/nav";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/docs")({
  component: DocsLayout,
});

function DocsSidebarContent() {
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarContent className="border-t p-2">
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
                      onClick={() => {
                        if (isMobile) setOpenMobile(false);
                      }}
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
  );
}

function DocsLayout() {
  return (
    <SidebarProvider
      className="mt-16 min-w-0 overflow-hidden border-t border-muted"
      style={{ height: "calc(100svh - 4rem)", minHeight: "calc(100svh - 4rem)" }}
    >
      <Sidebar className="top-16">
        <DocsSidebarContent />
      </Sidebar>
      <SidebarInset className="min-w-0">
        <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3 md:hidden">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 h-4"
          />
          <span className="text-sm font-medium">Documentation</span>
        </div>
        <ScrollArea className="min-h-0 min-w-0 flex-1 [&>[data-slot=scroll-area-viewport]>div]:block!">
          <Outlet />
        </ScrollArea>
      </SidebarInset>
    </SidebarProvider>
  );
}
