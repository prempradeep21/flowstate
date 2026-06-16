import SwiftUI

/// The app's root tab shell. On iOS 26 the tab bar renders as Liquid Glass
/// automatically; on earlier OSes it's the standard tab bar. List pages inside
/// stay on solid surfaces — glass is reserved for floating chrome only.
struct MainTabView: View {
    var body: some View {
        TabView {
            CanvasListView()
                .tabItem { Label("Canvases", systemImage: "square.grid.2x2") }
            LinksView()
                .tabItem { Label("Links", systemImage: "link") }
            ProfileView()
                .tabItem { Label("You", systemImage: "person") }
        }
    }
}
