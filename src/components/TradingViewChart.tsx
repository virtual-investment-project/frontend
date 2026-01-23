import React, { useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useColorScheme } from '../hooks/useColorScheme';

interface TradingViewChartProps {
  symbol: string;
  width?: number | string;
  height?: number | string;
}

export const TradingViewChart: React.FC<TradingViewChartProps> = ({
  symbol,
  width = '100%',
  height = 500,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const webViewRef = useRef<WebView>(null);

  // TradingView 위젯 HTML 생성
  const getHTML = () => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      height: 100%;
      overflow: hidden;
      background-color: ${isDark ? '#1E293B' : '#FFFFFF'};
    }
    #tradingview_widget {
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
  <div id="tradingview_widget"></div>
  <script type="text/javascript" src="https://s3.tradingview.com/tv.js"></script>
  <script type="text/javascript">
    new TradingView.widget({
      "autosize": true,
      "symbol": "${symbol}",
      "interval": "D",
      "timezone": "Asia/Seoul",
      "theme": "${isDark ? 'dark' : 'light'}",
      "style": "1",
      "locale": "kr",
      "toolbar_bg": "${isDark ? '#1E293B' : '#f1f3f6'}",
      "enable_publishing": false,
      "allow_symbol_change": false,
      "container_id": "tradingview_widget",
      "hide_top_toolbar": false,
      "hide_legend": false,
      "save_image": false,
      "studies": [
        "STD;SMA"
      ],
      "show_popup_button": false,
      "popup_width": "1000",
      "popup_height": "650"
    });
  </script>
</body>
</html>
    `;
  };

  return (
    <View style={[styles.container, { height: typeof height === 'number' ? height : undefined }]}>
      <WebView
        ref={webViewRef}
        source={{ html: getHTML() }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        scrollEnabled={false}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
