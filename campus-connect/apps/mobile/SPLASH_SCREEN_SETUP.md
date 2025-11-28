# Splash Screen Setup

The splash screen is now configured to show when the app launches. Here's what you need to do:

## Image Setup

1. **Add your splash screen image** to the following location:
   ```
   apps/mobile/assets/images/splash-screen.png
   ```

2. The image should be:
   - A high-resolution aerial view of TUM Heilbronn campus
   - Recommended size: At least 1080x1920 pixels (portrait orientation)
   - Format: PNG with transparency support, or JPG

3. If you have the image in a different format or location, you can either:
   - Rename it to `splash-screen.png` and place it in `apps/mobile/assets/images/`
   - Or modify `components/SplashScreen.tsx` to use a different image path

## How It Works

1. When the app opens, it shows the splash screen (`app/index.tsx`)
2. The splash screen displays for exactly **4 seconds**
3. After 4 seconds, it automatically navigates to the login page
4. The splash screen includes:
   - Background image of TUM Heilbronn campus
   - TUM logo (diamond shape)
   - "TUM Heilbronn" text in blue and white
   - "campus-connect" text below
   - Fade-in animations
   - Dark gradient overlay at the bottom

## Customization

You can customize the splash screen by editing:
- `components/SplashScreen.tsx` - Visual appearance and animations
- `app/index.tsx` - Timing (currently 4 seconds) and navigation destination

## Testing

To test the splash screen:
1. Make sure the image is in the correct location
2. Run the app: `npm start` or `expo start`
3. The splash screen should appear first, then navigate to login after 4 seconds

## Troubleshooting

If the image doesn't appear:
- Check that the file path is correct: `apps/mobile/assets/images/splash-screen.png`
- Verify the image file exists and isn't corrupted
- The app will show a blue placeholder background if the image can't be loaded
- Restart the Metro bundler after adding the image

