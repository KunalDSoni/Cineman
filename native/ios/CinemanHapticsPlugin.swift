//  CinemanHapticsPlugin.swift
//  CineMan — The Reel · native CoreHaptics bridge for Capacitor (iOS 13+).
//
//  Plays AHAP patterns sent from JavaScript on the real Taptic Engine, with
//  the intensity/sharpness parameter curves that give the F1-trailer feel —
//  something Mobile Safari cannot do at all.
//
//  SETUP: drag this file into ios/App/App/ in Xcode and add it to the "App"
//  target. Capacitor 6/7 auto-registers it via CAPBridgedPlugin (no .m file).
//  See CAPACITOR-HAPTICS-SETUP.md for the full flow.

import Foundation
import Capacitor
import CoreHaptics

@objc(CinemanHapticsPlugin)
public class CinemanHapticsPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "CinemanHapticsPlugin"
    public let jsName = "CinemanHaptics"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "prepare",   returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "supported", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "play",      returnType: CAPPluginReturnPromise),
    ]

    private var engine: CHHapticEngine?

    private var supportsHaptics: Bool {
        CHHapticEngine.capabilitiesForHardware().supportsHaptics
    }

    @objc func supported(_ call: CAPPluginCall) {
        call.resolve(["supported": supportsHaptics])
    }

    @objc func prepare(_ call: CAPPluginCall) {
        startEngine()
        call.resolve(["supported": supportsHaptics])
    }

    @objc func play(_ call: CAPPluginCall) {
        guard supportsHaptics else { call.resolve(["played": false]); return }
        guard let dict = call.getObject("ahap") else { call.reject("missing 'ahap' pattern"); return }
        if engine == nil { startEngine() }
        do {
            // CHHapticEngine parses an AHAP dictionary straight from a file URL,
            // sidestepping the [CHHapticPattern.Key: Any] bridging dance.
            let data = try JSONSerialization.data(withJSONObject: dict, options: [])
            let url = FileManager.default.temporaryDirectory
                .appendingPathComponent("cineman-pattern.ahap")
            try data.write(to: url, options: .atomic)
            try engine?.playPattern(from: url)
            call.resolve(["played": true])
        } catch {
            call.reject("haptic play failed: \(error.localizedDescription)")
        }
    }

    private func startEngine() {
        guard supportsHaptics, engine == nil else { return }
        engine = try? CHHapticEngine()
        engine?.isAutoShutdownEnabled = true
        // The engine can be stopped by the system (backgrounding, route change) —
        // restart it so the next pattern still fires.
        engine?.resetHandler = { [weak self] in try? self?.engine?.start() }
        engine?.stoppedHandler = { _ in }
        try? engine?.start()
    }
}
