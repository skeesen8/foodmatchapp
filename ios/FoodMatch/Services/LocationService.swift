import Foundation
import CoreLocation
import SwiftUI

// MARK: - Location Service
class LocationService: NSObject, ObservableObject {
    static let shared = LocationService()
    
    private let locationManager = CLLocationManager()
    
    @Published var currentLocation: CLLocation?
    @Published var authorizationStatus: CLAuthorizationStatus = .notDetermined
    @Published var isLocationEnabled: Bool = false
    @Published var locationError: LocationError?
    
    override init() {
        super.init()
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationManager.distanceFilter = 100 // Update every 100 meters
    }
    
    // MARK: - Location Permission
    func requestLocationPermission() {
        switch authorizationStatus {
        case .notDetermined:
            locationManager.requestWhenInUseAuthorization()
        case .denied, .restricted:
            locationError = .permissionDenied
        case .authorizedWhenInUse, .authorizedAlways:
            startLocationUpdates()
        @unknown default:
            locationError = .unknown
        }
    }
    
    // MARK: - Location Updates
    func startLocationUpdates() {
        guard authorizationStatus == .authorizedWhenInUse || authorizationStatus == .authorizedAlways else {
            locationError = .permissionDenied
            return
        }
        
        guard CLLocationManager.locationServicesEnabled() else {
            locationError = .locationServicesDisabled
            return
        }
        
        isLocationEnabled = true
        locationManager.startUpdatingLocation()
    }
    
    func stopLocationUpdates() {
        isLocationEnabled = false
        locationManager.stopUpdatingLocation()
    }
    
    // MARK: - One-time Location Fetch
    func getCurrentLocation() async throws -> CLLocation {
        return try await withCheckedThrowingContinuation { continuation in
            if let currentLocation = currentLocation {
                continuation.resume(returning: currentLocation)
                return
            }
            
            // Request a one-time location update
            locationManager.requestLocation()
            
            // Set up a temporary completion handler
            let completionHandler: (CLLocation?, Error?) -> Void = { location, error in
                if let location = location {
                    continuation.resume(returning: location)
                } else if let error = error {
                    continuation.resume(throwing: LocationError.locationUpdateFailed(error.localizedDescription))
                } else {
                    continuation.resume(throwing: LocationError.unknown)
                }
            }
            
            // Store the completion handler for the delegate to call
            self.oneTimeLocationCompletion = completionHandler
        }
    }
    
    private var oneTimeLocationCompletion: ((CLLocation?, Error?) -> Void)?
    
    // MARK: - Distance Calculations
    func distance(from location1: CLLocation, to location2: CLLocation) -> CLLocationDistance {
        return location1.distance(from: location2)
    }
    
    func distanceInMiles(from location1: CLLocation, to location2: CLLocation) -> Double {
        let distanceInMeters = distance(from: location1, to: location2)
        return distanceInMeters * 0.000621371 // Convert meters to miles
    }
    
    func distanceInKilometers(from location1: CLLocation, to location2: CLLocation) -> Double {
        let distanceInMeters = distance(from: location1, to: location2)
        return distanceInMeters / 1000.0 // Convert meters to kilometers
    }
    
    // MARK: - Coordinate Validation
    func isValidCoordinate(latitude: Double, longitude: Double) -> Bool {
        return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180
    }
    
    // MARK: - Address Geocoding
    func geocodeAddress(_ address: String) async throws -> CLLocation {
        let geocoder = CLGeocoder()
        
        return try await withCheckedThrowingContinuation { continuation in
            geocoder.geocodeAddressString(address) { placemarks, error in
                if let placemark = placemarks?.first,
                   let location = placemark.location {
                    continuation.resume(returning: location)
                } else if let error = error {
                    continuation.resume(throwing: LocationError.geocodingFailed(error.localizedDescription))
                } else {
                    continuation.resume(throwing: LocationError.geocodingFailed("No location found for address"))
                }
            }
        }
    }
    
    // MARK: - Reverse Geocoding
    func reverseGeocode(location: CLLocation) async throws -> String {
        let geocoder = CLGeocoder()
        
        return try await withCheckedThrowingContinuation { continuation in
            geocoder.reverseGeocodeLocation(location) { placemarks, error in
                if let placemark = placemarks?.first {
                    let address = [
                        placemark.subThoroughfare,
                        placemark.thoroughfare,
                        placemark.locality,
                        placemark.administrativeArea,
                        placemark.postalCode
                    ].compactMap { $0 }.joined(separator: ", ")
                    
                    continuation.resume(returning: address.isEmpty ? "Unknown location" : address)
                } else if let error = error {
                    continuation.resume(throwing: LocationError.reverseGeocodingFailed(error.localizedDescription))
                } else {
                    continuation.resume(throwing: LocationError.reverseGeocodingFailed("No address found"))
                }
            }
        }
    }
}

// MARK: - CLLocationManagerDelegate
extension LocationService: CLLocationManagerDelegate {
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        
        DispatchQueue.main.async {
            self.currentLocation = location
            self.locationError = nil
        }
        
        // Call one-time completion if needed
        if let completion = oneTimeLocationCompletion {
            completion(location, nil)
            oneTimeLocationCompletion = nil
        }
    }
    
    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        DispatchQueue.main.async {
            self.locationError = .locationUpdateFailed(error.localizedDescription)
        }
        
        // Call one-time completion if needed
        if let completion = oneTimeLocationCompletion {
            completion(nil, error)
            oneTimeLocationCompletion = nil
        }
    }
    
    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        DispatchQueue.main.async {
            self.authorizationStatus = manager.authorizationStatus
            
            switch manager.authorizationStatus {
            case .authorizedWhenInUse, .authorizedAlways:
                self.locationError = nil
                self.startLocationUpdates()
            case .denied, .restricted:
                self.locationError = .permissionDenied
                self.isLocationEnabled = false
            case .notDetermined:
                break
            @unknown default:
                self.locationError = .unknown
                self.isLocationEnabled = false
            }
        }
    }
}

// MARK: - Location Error Types
enum LocationError: LocalizedError {
    case permissionDenied
    case locationServicesDisabled
    case locationUpdateFailed(String)
    case geocodingFailed(String)
    case reverseGeocodingFailed(String)
    case unknown
    
    var errorDescription: String? {
        switch self {
        case .permissionDenied:
            return "Location permission denied. Please enable location access in Settings."
        case .locationServicesDisabled:
            return "Location services are disabled. Please enable them in Settings."
        case .locationUpdateFailed(let message):
            return "Failed to get location: \(message)"
        case .geocodingFailed(let message):
            return "Failed to find location for address: \(message)"
        case .reverseGeocodingFailed(let message):
            return "Failed to get address for location: \(message)"
        case .unknown:
            return "An unknown location error occurred."
        }
    }
    
    var recoverySuggestion: String? {
        switch self {
        case .permissionDenied, .locationServicesDisabled:
            return "Go to Settings > Privacy & Security > Location Services and enable location for FoodMatch."
        default:
            return "Please try again or check your internet connection."
        }
    }
}

// MARK: - Location Extensions
extension CLLocation {
    var coordinate2D: CLLocationCoordinate2D {
        return CLLocationCoordinate2D(latitude: coordinate.latitude, longitude: coordinate.longitude)
    }
}

extension CLLocationCoordinate2D {
    static func isValid(_ coordinate: CLLocationCoordinate2D) -> Bool {
        return CLLocationCoordinate2DIsValid(coordinate)
    }
} 