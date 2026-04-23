Add-Type -AssemblyName PresentationFramework
Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName WindowsBase
Add-Type -AssemblyName System.Windows.Forms

$xaml = @"
<Window
    xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
    Title="AutoMIDIcally" Height="420" Width="340"
    WindowStartupLocation="CenterScreen"
    ResizeMode="NoResize"
    Background="#0d0d0f"
    WindowStyle="None"
    AllowsTransparency="True"
    SnapsToDevicePixels="True">

  <Window.Resources>
    <Style x:Key="PrimaryBtn" TargetType="Button">
      <Setter Property="Background" Value="#7c3aed"/>
      <Setter Property="Foreground" Value="White"/>
      <Setter Property="FontFamily" Value="Segoe UI"/>
      <Setter Property="FontSize" Value="14"/>
      <Setter Property="FontWeight" Value="SemiBold"/>
      <Setter Property="Border.CornerRadius" Value="10"/>
      <Setter Property="Height" Value="44"/>
      <Setter Property="Cursor" Value="Hand"/>
      <Setter Property="Template">
        <Setter.Value>
          <ControlTemplate TargetType="Button">
            <Border Background="{TemplateBinding Background}" CornerRadius="10">
              <ContentPresenter HorizontalAlignment="Center" VerticalAlignment="Center"/>
            </Border>
            <ControlTemplate.Triggers>
              <Trigger Property="IsMouseOver" Value="True">
                <Setter Property="Background" Value="#6d28d9"/>
              </Trigger>
              <Trigger Property="IsPressed" Value="True">
                <Setter Property="Background" Value="#5b21b6"/>
              </Trigger>
            </ControlTemplate.Triggers>
          </ControlTemplate>
        </Setter.Value>
      </Setter>
    </Style>

    <Style x:Key="StopBtn" TargetType="Button" BasedOn="{StaticResource PrimaryBtn}">
      <Setter Property="Background" Value="#991b1b"/>
      <Style.Triggers>
        <Trigger Property="IsMouseOver" Value="True">
          <Setter Property="Background" Value="#b91c1c"/>
        </Trigger>
      </Style.Triggers>
    </Style>

    <Style x:Key="GhostBtn" TargetType="Button" BasedOn="{StaticResource PrimaryBtn}">
      <Setter Property="Background" Value="#1c1c1f"/>
      <Setter Property="FontSize" Value="12"/>
      <Setter Property="Height" Value="36"/>
      <Style.Triggers>
        <Trigger Property="IsMouseOver" Value="True">
          <Setter Property="Background" Value="#242427"/>
        </Trigger>
      </Style.Triggers>
    </Style>
  </Window.Resources>

  <Border Background="#0d0d0f" CornerRadius="16" BorderBrush="#2e2e32" BorderThickness="1">
    <Grid>
      <!-- Drag handle -->
      <Border x:Name="DragBar" Height="40" VerticalAlignment="Top" Background="Transparent" CornerRadius="16,16,0,0"/>

      <!-- Close button -->
      <Button x:Name="BtnClose" Content="✕" Width="28" Height="28" HorizontalAlignment="Right"
              VerticalAlignment="Top" Margin="0,8,10,0" Foreground="#6b7280"
              FontSize="13" Background="Transparent" BorderThickness="0" Cursor="Hand">
        <Button.Template>
          <ControlTemplate TargetType="Button">
            <Border Background="{TemplateBinding Background}" CornerRadius="6">
              <ContentPresenter HorizontalAlignment="Center" VerticalAlignment="Center"/>
            </Border>
            <ControlTemplate.Triggers>
              <Trigger Property="IsMouseOver" Value="True">
                <Setter Property="Background" Value="#7f1d1d"/>
                <Setter Property="TextElement.Foreground" Value="White"/>
              </Trigger>
            </ControlTemplate.Triggers>
          </ControlTemplate>
        </Button.Template>
      </Button>

      <StackPanel Margin="28,20,28,24">

        <!-- Logo -->
        <Image x:Name="AppLogo" Height="90" Width="90" HorizontalAlignment="Center" Margin="0,10,0,0"
               RenderOptions.BitmapScalingMode="HighQuality"/>

        <!-- Title -->
        <TextBlock Text="AutoMIDIcally" FontFamily="Segoe UI" FontSize="22" FontWeight="Bold"
                   Foreground="White" HorizontalAlignment="Center" Margin="0,10,0,2"/>
        <TextBlock Text="AI MIDI Pattern Generator" FontFamily="Segoe UI" FontSize="11"
                   Foreground="#6b7280" HorizontalAlignment="Center" Margin="0,0,0,20"/>

        <!-- Status pill -->
        <Border x:Name="StatusPill" Background="#1c1c1f" CornerRadius="20" Padding="14,7"
                HorizontalAlignment="Center" Margin="0,0,0,20">
          <StackPanel Orientation="Horizontal">
            <Ellipse x:Name="StatusDot" Width="8" Height="8" Fill="#3a3a3f" Margin="0,0,8,0"/>
            <TextBlock x:Name="StatusText" Text="Ready to launch" FontFamily="Segoe UI"
                       FontSize="12" Foreground="#9ca3af"/>
          </StackPanel>
        </Border>

        <!-- URL label -->
        <TextBlock x:Name="UrlLabel" Text="" FontFamily="Consolas" FontSize="11"
                   Foreground="#7c3aed" HorizontalAlignment="Center" Margin="0,0,0,16"
                   Cursor="Hand" TextDecorations="Underline" Visibility="Collapsed"/>

        <!-- Launch / Stop button -->
        <Button x:Name="BtnLaunch" Content="Launch App" Style="{StaticResource PrimaryBtn}" Margin="0,0,0,10"/>

        <!-- Open browser button -->
        <Button x:Name="BtnBrowser" Content="Open in Browser" Style="{StaticResource GhostBtn}"
                Margin="0,0,0,0" Visibility="Collapsed"/>

      </StackPanel>
    </Grid>
  </Border>
</Window>
"@

$reader = [System.Xml.XmlReader]::Create([System.IO.StringReader]::new($xaml))
$window = [Windows.Markup.XamlReader]::Load($reader)

# ── Get controls
$btnLaunch  = $window.FindName("BtnLaunch")
$btnStop    = $window.FindName("BtnLaunch")
$btnClose   = $window.FindName("BtnClose")
$btnBrowser = $window.FindName("BtnBrowser")
$statusText = $window.FindName("StatusText")
$statusDot  = $window.FindName("StatusDot")
$statusPill = $window.FindName("StatusPill")
$urlLabel   = $window.FindName("UrlLabel")
$dragBar    = $window.FindName("DragBar")
$appLogo    = $window.FindName("AppLogo")
$btnLaunch  = $window.FindName("BtnLaunch")

# ── Load logo
$logoPath = "C:\Users\vasha\Downloads\AutoMIDIcally\public\logo-v2.png"
if (Test-Path $logoPath) {
    $bitmap = New-Object System.Windows.Media.Imaging.BitmapImage
    $bitmap.BeginInit()
    $bitmap.UriSource = [Uri]::new($logoPath)
    $bitmap.CacheOption = [System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad
    $bitmap.EndInit()
    $appLogo.Source = $bitmap
}

# ── Drag window
$window.Add_MouseLeftButtonDown({ $window.DragMove() })
$dragBar.Add_MouseLeftButtonDown({ $window.DragMove() })

# ── State
$script:devProcess = $null
$script:port = 5173

function Set-Idle {
    $statusDot.Fill    = "#3a3a3f"
    $statusText.Text   = "Ready to launch"
    $statusPill.Background = "#1c1c1f"
    $btnLaunch.Content = "Launch App"
    $btnLaunch.Style   = $window.Resources["PrimaryBtn"]
    $urlLabel.Visibility   = "Collapsed"
    $btnBrowser.Visibility = "Collapsed"
}

function Set-Starting {
    $statusDot.Fill    = [System.Windows.Media.Brushes]::Orange
    $statusText.Text   = "Starting server…"
    $statusPill.Background = "#1c0a00"
    $btnLaunch.IsEnabled = $false
}

function Set-Running($port) {
    $statusDot.Fill    = "#22c55e"
    $statusText.Text   = "Running on :$port"
    $statusPill.Background = "#052e16"
    $btnLaunch.Content = "Stop Server"
    $btnLaunch.Style   = $window.Resources["StopBtn"]
    $btnLaunch.IsEnabled   = $true
    $urlLabel.Text         = "http://localhost:$port"
    $urlLabel.Visibility   = "Visible"
    $btnBrowser.Visibility = "Visible"
}

Set-Idle

# ── Launch / Stop click
$btnLaunch.Add_Click({
    if ($script:devProcess -and !$script:devProcess.HasExited) {
        # Stop
        Stop-Process -Id $script:devProcess.Id -Force -ErrorAction SilentlyContinue
        $script:devProcess = $null
        Set-Idle
    } else {
        # Start
        Set-Starting

        $psi = New-Object System.Diagnostics.ProcessStartInfo
        $psi.FileName = "cmd.exe"
        $psi.Arguments = "/c cd /d C:\Users\vasha\Downloads\AutoMIDIcally && npm run dev"
        $psi.UseShellExecute = $false
        $psi.CreateNoWindow  = $true
        $psi.RedirectStandardOutput = $true
        $psi.RedirectStandardError  = $true

        $script:devProcess = [System.Diagnostics.Process]::Start($psi)

        # Poll for the port in a background job then update UI
        $window.Dispatcher.InvokeAsync({}, [System.Windows.Threading.DispatcherPriority]::Background) | Out-Null

        $timer = New-Object System.Windows.Threading.DispatcherTimer
        $timer.Interval = [TimeSpan]::FromMilliseconds(800)
        $attempts = 0
        $timer.Add_Tick({
            $attempts++
            # Try ports 5173-5176
            foreach ($p in 5173,5174,5175,5176) {
                try {
                    $tcp = New-Object System.Net.Sockets.TcpClient
                    $tcp.Connect("localhost", $p)
                    $tcp.Close()
                    $timer.Stop()
                    $script:port = $p
                    Set-Running $p
                    Start-Process "http://localhost:$p"
                    return
                } catch {}
            }
            if ($attempts -gt 20) { $timer.Stop(); Set-Idle }
        })
        $timer.Start()
    }
})

# ── Open browser
$btnBrowser.Add_Click({ Start-Process "http://localhost:$script:port" })

# ── URL label click
$urlLabel.Add_MouseLeftButtonUp({ Start-Process "http://localhost:$script:port" })

# ── Close
$btnClose.Add_Click({
    if ($script:devProcess -and !$script:devProcess.HasExited) {
        Stop-Process -Id $script:devProcess.Id -Force -ErrorAction SilentlyContinue
    }
    $window.Close()
})

$window.ShowDialog() | Out-Null
