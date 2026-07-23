import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';
import 'package:url_launcher/url_launcher.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'BAUST SLG',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primaryColor: const Color(0xFF006B3F),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF006B3F),
          primary: const Color(0xFF006B3F),
        ),
        useMaterial3: true,
      ),
      home: const GatewayWebViewPage(),
    );
  }
}

class GatewayWebViewPage extends StatefulWidget {
  const GatewayWebViewPage({super.key});

  @override
  State<GatewayWebViewPage> createState() => _GatewayWebViewPageState();
}

class _GatewayWebViewPageState extends State<GatewayWebViewPage> {
  late final WebViewController _controller;
  bool _isLoading = true;
  double _loadingProgress = 0.0;
  bool _hasError = false;

  @override
  void initState() {
    super.initState();
    if (!kIsWeb) {
      _controller = WebViewController()
        ..setJavaScriptMode(JavaScriptMode.unrestricted);

      // Enable DOM storage (localStorage / sessionStorage) on Android WebView so login session persists!
      if (_controller.platform is AndroidWebViewController) {
        (_controller.platform as AndroidWebViewController).setDomStorageEnabled(true);
      }

      _controller
        ..setNavigationDelegate(
          NavigationDelegate(
            onProgress: (int progress) {
              setState(() {
                _loadingProgress = progress / 100.0;
              });
            },
            onPageStarted: (String url) {
              setState(() {
                _isLoading = true;
                _hasError = false;
              });
            },
            onPageFinished: (String url) {
              setState(() {
                _isLoading = false;
              });
            },
            onWebResourceError: (WebResourceError error) {
              // Main page loads can trigger host errors, show error screen
              final isMainFrame = error.isForMainFrame ?? true;
              if (isMainFrame) {
                setState(() {
                  _hasError = true;
                  _isLoading = false;
                });
              }
            },
            onNavigationRequest: (NavigationRequest request) async {
              final url = request.url;
              final isSupabaseStorage = url.contains('supabase.co/storage/');
              final isGeneratorDownload = url.contains('/api/generate') || url.contains('autoDownload=true');
              final isFileExtension = url.endsWith('.pdf') || 
                                     url.endsWith('.docx') || 
                                     url.endsWith('.doc') || 
                                     url.endsWith('.xlsx') || 
                                     url.endsWith('.xls') || 
                                     url.endsWith('.pptx') || 
                                     url.endsWith('.ppt') || 
                                     url.endsWith('.zip');
                                     
              if (isSupabaseStorage || isGeneratorDownload || isFileExtension) {
                try {
                  final uri = Uri.parse(url);
                  if (await canLaunchUrl(uri)) {
                    await launchUrl(uri, mode: LaunchMode.externalApplication);
                    return NavigationDecision.prevent;
                  }
                } catch (e) {
                  debugPrint('Error launching download URL: $e');
                }
              }
              return NavigationDecision.navigate;
            },
          ),
        )
        ..loadRequest(Uri.parse('https://slg-baust.vercel.app/'));
    } else {
      _isLoading = false;
    }
  }

  Future<bool> _onWillPop() async {
    if (!kIsWeb && await _controller.canGoBack()) {
      await _controller.goBack();
      return false;
    }
    return true;
  }

  Widget _buildWebPreview() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 90,
              height: 90,
              decoration: BoxDecoration(
                color: const Color(0xFFE6F4EA),
                borderRadius: BorderRadius.circular(24),
              ),
              child: const Icon(
                Icons.language_rounded,
                size: 48,
                color: Color(0xFF006B3F),
              ),
            ),
            const SizedBox(height: 28),
            const Text(
              'BAUST Smart Learning Gateway',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1E293B),
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'This Flutter wrapper app is optimized for Android and iOS mobile devices. To preview or use the gateway on your desktop computer, please browse the web application directly.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: Color(0xFF64748B),
                height: 1.5,
              ),
            ),
            const SizedBox(height: 36),
            const SelectableText(
              'https://slg-baust.vercel.app',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Color(0xFF006B3F),
                decoration: TextDecoration.underline,
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: _onWillPop,
      child: Scaffold(
        backgroundColor: Colors.white,
        body: SafeArea(
          child: kIsWeb
              ? _buildWebPreview()
              : Stack(
                  children: [
                    if (!_hasError)
                      WebViewWidget(controller: _controller),
                    
                    // Loading Progress Bar
                    if (_isLoading && !_hasError)
                      Positioned(
                        top: 0,
                        left: 0,
                        right: 0,
                        child: LinearProgressIndicator(
                          value: _loadingProgress,
                          backgroundColor: Colors.transparent,
                          valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF006B3F)),
                          minHeight: 3,
                        ),
                      ),

                    // Custom Offline/Error Screen
                    if (_hasError)
                      Center(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 32.0),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                width: 80,
                                height: 80,
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFEE2E2),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: const Icon(
                                  Icons.wifi_off_rounded,
                                  size: 40,
                                  color: Color(0xFFDC2626),
                                ),
                              ),
                              const SizedBox(height: 24),
                              const Text(
                                'Connection Error',
                                style: TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF1E293B),
                                ),
                              ),
                              const SizedBox(height: 12),
                              const Text(
                                'Unable to load the smart gateway. Please check your internet connection and try again.',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Color(0xFF64748B),
                                  height: 1.5,
                                ),
                              ),
                              const SizedBox(height: 32),
                              ElevatedButton.icon(
                                onPressed: () {
                                  _controller.reload();
                                },
                                icon: const Icon(Icons.refresh_rounded, color: Colors.white),
                                label: const Text(
                                  'Retry Connection',
                                  style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
                                ),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF006B3F),
                                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
        ),
      ),
    );
  }
}
