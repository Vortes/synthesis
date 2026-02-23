{
  "targets": [
    {
      "target_name": "ax_url_reader",
      "sources": ["src/ax_url_reader.mm"],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "defines": ["NAPI_DISABLE_CPP_EXCEPTIONS"],
      "xcode_settings": {
        "OTHER_CPLUSPLUSFLAGS": ["-std=c++17", "-ObjC++", "-fobjc-arc"],
        "OTHER_LDFLAGS": [
          "-framework ApplicationServices",
          "-framework AppKit",
          "-framework CoreFoundation"
        ]
      }
    }
  ]
}
